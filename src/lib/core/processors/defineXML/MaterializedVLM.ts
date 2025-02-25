// src/lib/core/processors/defineXML/MaterializedVLM.ts
import type {
	WhereClauseDef,
	RangeCheck,
	ValueListDef,
	ParsedDefineXML,
	ItemDef,
	ItemGroup,
	ItemRef
} from '$lib/types/define-xml';
import { normalizeDatasetId } from '$lib/core/utils/datasetUtils';
import type { VLMItemRef, ProcessedVLM } from '$lib/core/processors/defineXML/VLMProcessingLogic';
import { methodUtils } from '$lib/utils/defineXML/methodUtils';

/**
 * Represents a cell value in the VLM table
 */
export interface MaterializedCellValue {
	value: string | null;
	display?: string;
	derivation?: string;
	originType?: string;
	originSource?: string | null;
	methodOID?: string;
	methodDescription?: string | null;
	commentOID?: string;
	commentText?: string | null;
	itemDef?: ItemDef;
}

/**
 * Represents a materialized row in the VLM table
 */
export interface MaterializedVLMRow {
	paramcd: string;
	param: string;
	whereOID?: string;
	whereClauseText?: string;
	duplicateSource?: string; // DTYPE, AVISITN, etc.
	duplicateValue?: string; // Value of the duplicate source
	cells: Map<string, MaterializedCellValue>;
	rowOrder: number; // For sorting the rows
}

/**
 * Represents the materialized VLM table
 */
export interface MaterializedVLMResult {
	dataset: string;
	columns: string[]; // Variable names
	rows: MaterializedVLMRow[];
	duplicateSources: string[]; // Variables that cause duplicate rows
}

/**
 * Creates a materialized representation of the VLM table
 */
export function materializeVLM(
	define: ParsedDefineXML,
	datasetName: string,
	vlmData: ProcessedVLM
): MaterializedVLMResult {
	console.log('Materializing VLM for dataset:', datasetName);

	const result: MaterializedVLMResult = {
		dataset: datasetName,
		columns: [],
		rows: [],
		duplicateSources: []
	};

	// 1. Determine all columns (variables) that should appear in the table
	// Start with PARAMCD and PARAM as default columns
	result.columns = ['PARAMCD', 'PARAM'];

	// Add other variables from the VLM
	vlmData.variables.forEach((variable) => {
		if (!result.columns.includes(variable.name)) {
			result.columns.push(variable.name);
		}
	});

	// Add variables from ItemGroup (previously ItemGroupDef)
	const normalizedDatasetName = normalizeDatasetId(datasetName);
	const itemGroup = define.ItemGroups?.find(
		(ig) => normalizeDatasetId(ig.Name || '') === normalizedDatasetName
	);

	if (itemGroup && itemGroup.ItemRefs) {
		itemGroup.ItemRefs.forEach((itemRef) => {
			// Fix - Use correct property name based on your type definition
			const itemDefOID = (itemRef as any).ItemOID || itemRef.OID; // Use whichever exists in your type
			if (!itemDefOID) return;

			const itemDef = define.ItemDefs?.find((id) => id.OID === itemDefOID);
			if (itemDef && itemDef.Name && !result.columns.includes(itemDef.Name)) {
				result.columns.push(itemDef.Name);
			}
		});
	}

	// 2. Get all parameters
	const paramcds = Array.from(
		new Set(
			Array.from(vlmData.variables.values()).flatMap((v) =>
				v.valueListDef.ItemRefs.map((ref) => ref.paramcd)
			)
		)
	);

	// 3. Get all potential duplicate sources
	const duplicateSources = identifyDuplicateSources(define, datasetName);
	result.duplicateSources = duplicateSources;

	// Get the mapping of which parameters are affected by which sources
	const paramDuplicateMap = identifyApplicableDuplicateSources(define, datasetName, paramcds);

	// Get the mapping from PARAMCD to PARAM labels
	const paramToParamcdMap = getParamLabels(define, datasetName);

	// 4. Create base rows for each parameter
	const baseRows = createBaseRows(vlmData, paramToParamcdMap);

	// 5. Process duplicate rows using the parameter-to-duplicates mapping
	const allRows = processDuplicateRows(
		baseRows,
		vlmData,
		duplicateSources,
		paramDuplicateMap,
		define
	);

	// 6. Populate cell values
	populateCellValues(allRows, vlmData, define);

	// 7. Sort rows
	const sortedRows = sortRows(allRows);

	result.rows = sortedRows;

	console.log('Materialized VLM:', {
		dataset: result.dataset,
		columnCount: result.columns.length,
		rowCount: result.rows.length,
		duplicateSources: result.duplicateSources
	});

	return result;
}

function identifyApplicableDuplicateSources(
	define: ParsedDefineXML,
	datasetName: string,
	parameters: string[]
): Map<string, string[]> {
	// Map to store which parameters are affected by which duplicate sources
	// Format: Map<paramcd, string[]> where string[] is the list of variables causing duplicates
	const paramDuplicateMap = new Map<string, string[]>();

	// Initialize each parameter with an empty array
	parameters.forEach((param) => {
		paramDuplicateMap.set(param, []);
	});

	// Analyze WhereClauseDefs to find relationships between parameters and duplicate-causing variables
	define.WhereClauseDefs?.forEach((whereClause) => {
		// Extract all the paramcds referenced in this where clause
		const paramcds: string[] = [];
		let duplicateSource: string | null = null;

		// Find all RangeChecks that refer to PARAMCD
		whereClause.RangeChecks?.forEach((check) => {
			const itemParts = check.ItemOID?.split('.');
			if (itemParts?.length === 3 && itemParts[2] === 'PARAMCD') {
				// This is a PARAMCD check, extract the values
				if (check.Comparator === 'EQ' || check.Comparator === 'IN') {
					paramcds.push(...check.CheckValues);
				}
			}

			// Check if this RangeCheck refers to a duplicate-causing variable
			if (itemParts?.length === 3) {
				const varName = itemParts[2];
				if (
					['DTYPE', 'AVISITN', 'AVALCAT1', 'AVALCAT2', 'ASEQ', 'ONTRTFL', 'POSTTRTFL'].includes(
						varName
					)
				) {
					duplicateSource = varName;
				}
			}
		});

		// If we found both parameters and a duplicate source in this where clause,
		// they're related
		if (paramcds.length > 0 && duplicateSource) {
			paramcds.forEach((param) => {
				if (paramDuplicateMap.has(param)) {
					const sources = paramDuplicateMap.get(param) || [];
					if (!sources.includes(duplicateSource!)) {
						sources.push(duplicateSource!);
						paramDuplicateMap.set(param, sources);
					}
				}
			});
		}

		// Also check if the OID of the WhereClause itself mentions a duplicate source
		// This is common in Define-XML where the OID might be like "WC.ADSL.DTYPE.AGEGRP1"
		if (whereClause.OID) {
			const oidParts = whereClause.OID.split('.');
			for (const part of oidParts) {
				if (
					['DTYPE', 'AVISITN', 'AVALCAT1', 'AVALCAT2', 'ASEQ', 'ONTRTFL', 'POSTTRTFL'].includes(
						part
					)
				) {
					duplicateSource = part;

					// If we also have paramcds, they're related
					if (paramcds.length > 0) {
						paramcds.forEach((param) => {
							if (paramDuplicateMap.has(param)) {
								const sources = paramDuplicateMap.get(param) || [];
								if (!sources.includes(duplicateSource!)) {
									sources.push(duplicateSource!);
									paramDuplicateMap.set(param, sources);
								}
							}
						});
					}

					break;
				}
			}
		}
	});

	// Also check MethodDefs for references to parameters with derivations
	// This is another way to identify potential duplicates
	define.Methods?.forEach((method) => {
		if (method.OID) {
			const oidParts = method.OID.split('.');
			let paramcd: string | null = null;
			let duplicateSource: string | null = null;

			// Look for parameter and duplicate source in the OID
			for (const part of oidParts) {
				if (parameters.includes(part)) {
					paramcd = part;
				}
				if (
					['DTYPE', 'AVISITN', 'AVALCAT1', 'AVALCAT2', 'ASEQ', 'ONTRTFL', 'POSTTRTFL'].includes(
						part
					)
				) {
					duplicateSource = part;
				}
			}

			// Check description text for mentions of derivation methods
			if (paramcd && method.Description) {
				const descText =
					typeof method.Description === 'string'
						? method.Description
						: method.Description.TranslatedText || '';

				if (
					descText.toLowerCase().includes('derive') ||
					descText.toLowerCase().includes('impute') ||
					descText.toLowerCase().includes('locf') ||
					descText.toLowerCase().includes('average')
				) {
					// This suggests there are derived versions
					if (!duplicateSource) duplicateSource = 'DTYPE'; // Default to DTYPE

					const sources = paramDuplicateMap.get(paramcd) || [];
					if (!sources.includes(duplicateSource)) {
						sources.push(duplicateSource);
						paramDuplicateMap.set(paramcd, sources);
					}
				}
			}
		}
	});

	return paramDuplicateMap;
}

/**
 * Identifies variables in the dataset that can cause duplicate rows
 */
function identifyDuplicateSources(define: ParsedDefineXML, datasetName: string): string[] {
	const duplicateSources: string[] = [];
	const normalizedDatasetName = normalizeDatasetId(datasetName);

	// Common duplicate-causing variables
	const possibleDuplicates = [
		'DTYPE',
		'AVISITN',
		'AVALCAT1',
		'AVALCAT2',
		'AVALCAT3',
		'ASEQ',
		'ONTRTFL',
		'POSTTRTFL',
		'CRIT1',
		'CRIT2',
		'CRIT3'
	];

	// Check if these variables exist in the dataset
	possibleDuplicates.forEach((varName) => {
		const itemDef = define.ItemDefs?.find((def) => {
			const parts = def.OID?.split('.');
			return (
				parts?.[0] === 'IT' &&
				normalizeDatasetId(parts?.[1] || '') === normalizedDatasetName &&
				parts?.[2] === varName
			);
		});

		if (itemDef) {
			duplicateSources.push(varName);
		}
	});

	return duplicateSources;
}

/**
 * Gets the mapping from PARAMCD to PARAM labels
 */
function getParamLabels(define: ParsedDefineXML, datasetName: string): Map<string, string> {
	const paramcdToParamMap = new Map<string, string>();
	const normalizedDatasetName = normalizeDatasetId(datasetName);

	const paramcdItemDef = define.ItemDefs?.find((def) => {
		const parts = def.OID?.split('.');
		return (
			parts?.[0] === 'IT' &&
			normalizeDatasetId(parts?.[1] || '') === normalizedDatasetName &&
			parts?.[2] === 'PARAMCD'
		);
	});

	if (paramcdItemDef?.CodeListOID) {
		const codeList = define.CodeLists?.find((cl) => cl.OID === paramcdItemDef.CodeListOID);
		if (codeList?.CodeListItems) {
			codeList.CodeListItems.forEach((item) => {
				if (item.CodedValue && item.Decode?.TranslatedText) {
					paramcdToParamMap.set(item.CodedValue, item.Decode.TranslatedText);
				}
			});
		}
	}

	return paramcdToParamMap;
}

/**
 * Creates the base rows for each parameter
 */
function createBaseRows(
	vlmData: ProcessedVLM,
	paramToParamcdMap: Map<string, string>
): MaterializedVLMRow[] {
	const baseRows: MaterializedVLMRow[] = [];
	const processedParamcds = new Set<string>();

	// Process each VLM variable
	vlmData.variables.forEach((variable) => {
		// For each ItemRef in the ValueListDef
		variable.valueListDef.ItemRefs.forEach((itemRef, index) => {
			const paramcd = itemRef.paramcd;

			// Skip if we already processed this PARAMCD
			if (processedParamcds.has(paramcd)) {
				return;
			}

			processedParamcds.add(paramcd);

			const baseRow: MaterializedVLMRow = {
				paramcd,
				param: paramToParamcdMap.get(paramcd) || itemRef.paramInfo?.decode || paramcd,
				whereOID: itemRef.whereClause?.whereClauseOID,
				whereClauseText: formatWhereClause(itemRef),
				cells: new Map(),
				rowOrder: index
			};

			baseRows.push(baseRow);
		});
	});

	return baseRows;
}

/**
 * Formats the where clause for display
 */
function formatWhereClause(itemRef: VLMItemRef): string {
	if (!itemRef.whereClause) return '';

	const variable = itemRef.whereClause.source.variable;
	const comparator = itemRef.whereClause.comparator;
	const values = itemRef.whereClause.checkValues;

	let operator = '';
	switch (comparator) {
		case 'EQ':
			operator = '=';
			break;
		case 'NE':
			operator = '≠';
			break;
		case 'LT':
			operator = '<';
			break;
		case 'LE':
			operator = '≤';
			break;
		case 'GT':
			operator = '>';
			break;
		case 'GE':
			operator = '≥';
			break;
		case 'IN':
			operator = 'IN';
			break;
		case 'NOTIN':
			operator = 'NOT IN';
			break;
		default:
			operator = comparator;
	}

	if (comparator === 'IN' || comparator === 'NOTIN') {
		return `${variable} ${operator} (${values.join(', ')})`;
	} else {
		return `${variable} ${operator} ${values[0]}`;
	}
}

/**
 * Processes duplicate rows based on variables that cause duplicates
 */
function processDuplicateRows(
	baseRows: MaterializedVLMRow[],
	vlmData: ProcessedVLM,
	duplicateSources: string[],
	paramDuplicateMap: Map<string, string[]>,
	define: ParsedDefineXML
): MaterializedVLMRow[] {
	const allRows: MaterializedVLMRow[] = [...baseRows];

	// For each base row
	baseRows.forEach((baseRow) => {
		const paramcd = baseRow.paramcd;
		// Get the sources that apply to this parameter
		const applicableSources = paramDuplicateMap.get(paramcd) || [];

		// For each applicable source
		applicableSources.forEach((source) => {
			// Get the possible values for this source
			const values = getDuplicateSourceValues(source, define);

			// No values found, skip
			if (values.length === 0) return;

			// For each possible value, create a duplicate row
			values.forEach((value, valueIndex) => {
				// Create a new row with this duplicate value
				const duplicateRow: MaterializedVLMRow = {
					...baseRow,
					duplicateSource: source,
					duplicateValue: value,
					cells: new Map(baseRow.cells),
					rowOrder: baseRow.rowOrder * 100 + valueIndex + 1
				};

				// Add the duplicate row
				allRows.push(duplicateRow);
			});
		});
	});

	return allRows;
}

/**
 * Gets the possible values for a duplicate source variable
 */
function getDuplicateSourceValues(source: string, define: ParsedDefineXML): string[] {
	const values: string[] = [];

	// Find the ItemDef for this variable
	const itemDef = define.ItemDefs?.find((def) => {
		const parts = def.OID?.split('.');
		return parts && parts.length > 2 && parts[2] === source;
	});

	if (!itemDef) return values;

	// Check if it has a codelist
	if (itemDef.CodeListOID) {
		const codeList = define.CodeLists?.find((cl) => cl.OID === itemDef.CodeListOID);

		if (codeList?.CodeListItems) {
			codeList.CodeListItems.forEach((item) => {
				if (item.CodedValue) {
					values.push(item.CodedValue);
				}
			});
		} else if (codeList?.EnumeratedItems) {
			codeList.EnumeratedItems.forEach((item) => {
				if (item.CodedValue) {
					values.push(item.CodedValue);
				}
			});
		}
	} else {
		// Default values for common variables if no codelist found
		switch (source) {
			case 'DTYPE':
				values.push('LOCF', 'Mean', 'Worst');
				break;
			case 'ONTRTFL':
			case 'POSTTRTFL':
				values.push('Y', 'N');
				break;
			case 'ASEQ':
				values.push('1', '2', '3');
				break;
			default:
				// Add some default values for other variables
				values.push('1', '2');
		}
	}

	return values;
}

/**
 * Populates cell values for all rows
 */
function populateCellValues(
	allRows: MaterializedVLMRow[],
	vlmData: ProcessedVLM,
	define: ParsedDefineXML
): void {
	// For each row
	allRows.forEach((row) => {
		// Process PARAMCD and PARAM cells
		row.cells.set('PARAMCD', { value: row.paramcd });
		row.cells.set('PARAM', { value: row.param });

		// If this is a duplicate row, set the duplicate source value
		if (row.duplicateSource && row.duplicateValue) {
			row.cells.set(row.duplicateSource, { value: row.duplicateValue });
		}

		// For each variable in VLM
		vlmData.variables.forEach((variable) => {
			const varName = variable.name;

			// Skip PARAMCD and PARAM which we already handled
			if (varName === 'PARAMCD' || varName === 'PARAM') return;

			// Find the appropriate ItemRef for this PARAMCD
			const itemRef = variable.valueListDef.ItemRefs.find((ref) => ref.paramcd === row.paramcd);

			if (!itemRef) return;

			// Find the corresponding ItemDef
			const itemDef = define.ItemDefs?.find((def) => def.OID === itemRef.OID);
			if (!itemDef) return;

			// Create the cell value
			const cellValue: MaterializedCellValue = {
				value: deriveCellValue(row, itemRef, itemDef),
				// Fix - Address Description possibly being a string or an object
				display:
					typeof itemDef.Description === 'string'
						? itemDef.Description
						: itemDef.Description?.TranslatedText,
				itemDef: itemDef,
				originType: itemRef.origin?.type,
				originSource: itemRef.origin?.source || null,
				methodOID: itemRef.methodOID,
				methodDescription: itemRef.method?.Description,
				// Fix - Use the correct property name for commentOID
				commentOID: itemDef.CommentOID || itemDef.def_CommentOID
			};

			// If it's a comment, try to get the text
			if (cellValue.commentOID) {
				const comment = define.Comments?.find((c) => c.OID === cellValue.commentOID);
				if (comment) {
					// Fix - Address Description possibly being a string or an object
					cellValue.commentText =
						typeof comment.Description === 'string'
							? comment.Description
							: comment.Description?.TranslatedText;
				}
			}

			// Set the cell value
			row.cells.set(varName, cellValue);
		});
	});
}

/**
 * Derives a cell value based on the row and item definitions
 */
function deriveCellValue(
	row: MaterializedVLMRow,
	itemRef: VLMItemRef,
	itemDef: ItemDef
): string | null {
	// If this is a duplicate row, special handling
	if (row.duplicateSource && row.duplicateValue) {
		// Some variables have special computation based on duplicate variables
		const sourceVar = row.duplicateSource;
		const sourceVal = row.duplicateValue;

		// Special handling for certain variables in duplicate context
		if (itemDef.Name) {
			switch (itemDef.Name) {
				case 'AVAL':
					if (sourceVar === 'DTYPE') {
						// Simulate a derived value based on DTYPE
						if (sourceVal === 'LOCF') return 'LOCF(AVAL)';
						if (sourceVal === 'Mean') return 'Mean(AVAL)';
						return `${sourceVal}(AVAL)`;
					}
					break;

				case 'AVALC':
					if (sourceVar === 'DTYPE') {
						// Simulate a derived character value based on DTYPE
						if (sourceVal === 'LOCF') return 'LOCF value';
						if (sourceVal === 'Mean') return 'Mean value';
						return `${sourceVal} value`;
					}
					break;
			}
		}
	}

	// Default value - could be enhanced with more complex derivation logic
	// For now, just use a placeholder based on the data type
	switch (itemDef.DataType) {
		case 'integer':
			return '1';
		case 'float':
			return '1.0';
		case 'text':
			return 'TEXT';
		case 'date':
			return '2023-01-01';
		default:
			return '';
	}
}

/**
 * Sorts the rows by PARAMCD and duplicate information
 */
function sortRows(rows: MaterializedVLMRow[]): MaterializedVLMRow[] {
	return rows.sort((a, b) => {
		// First sort by PARAMCD
		if (a.paramcd !== b.paramcd) {
			return a.paramcd.localeCompare(b.paramcd);
		}

		// If same PARAMCD, base rows come first
		if (!a.duplicateSource && b.duplicateSource) return -1;
		if (a.duplicateSource && !b.duplicateSource) return 1;

		// If both are duplicate rows, sort by source
		if (a.duplicateSource && b.duplicateSource) {
			if (a.duplicateSource !== b.duplicateSource) {
				return a.duplicateSource.localeCompare(b.duplicateSource);
			}

			// If same source, sort by value
			if (a.duplicateValue && b.duplicateValue) {
				return a.duplicateValue.localeCompare(b.duplicateValue);
			}
		}

		// Otherwise, sort by row order
		return a.rowOrder - b.rowOrder;
	});
}
