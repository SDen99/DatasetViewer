// src/lib/core/processors/defineXML/VLMProcessingLogic.ts
import type {
	WhereClauseDef,
	RangeCheck,
	MethodInfo,
	ValueListDef,
	ParsedDefineXML,
	ItemDef,
	Method
} from '$lib/types/define-xml';
import { normalizeDatasetId } from '$lib/core/utils/datasetUtils';
import { methodUtils } from '$lib/utils/defineXML/methodUtils';

export interface CodeListInfo {
	ordinal: number;
	codedValue: string;
	decode: string;
	isExternal: boolean;
	externalCodeList?: {
		dictionary: string;
		version: string;
	};
}

export interface OriginInfo {
	type: string;
	source: string | null;
	description?: string | null;
	translatedText?: string | null;
}

export interface VLMItemRef {
	paramcd: string;
	paramInfo?: CodeListInfo;
	whereClause?: {
		comparator: RangeCheck['Comparator'];
		checkValues: string[];
		whereClauseOID: string;
		OID: string;
		source: {
			domain: string;
			variable: string;
		};
	};
	methodOID?: string;
	valueListOID?: string;
	OID?: string;
	method?: MethodInfo;
	origin?: OriginInfo;
	itemDescription?: string | null;
	mandatory: boolean;
	orderNumber: number;
	sources?: {
		[variable: string]: {
			domain?: string;
			variable?: string;
			type?: string;
			value?: string;
		};
	};
	codelist?: {
		OID: string;
		name?: string;
		items?: Array<{
			codedValue: string;
			decode: string;
			isExtended?: boolean;
		}>;
	};
	dtype?: string; // Derivation type if applicable
	analysisFlags?: string[]; // Analysis flags (ANLxxFL)
	visitContext?: string; // Visit context information
	duplicateContext?: {
		// Information about why duplicates exist
		reason: string; // Main reason (DTYPE, ANLxxFL, etc.)
		details: string; // Additional details
	};
	specialVariables?: {
		// Track variables that create duplicates
		[variable: string]: string; // Variable name -> value
	};
}

export interface VLMVariable {
	name: string;
	valueListDef: {
		OID: string;
		ItemRefs: VLMItemRef[];
	};
	origin?: string;
	codeList?: string;
}

export interface ProcessedVLM {
	dataset: string;
	variables: Map<string, VLMVariable>;
}

interface WhereClauseResult {
	paramcd: string[];
	conditions: {
		variable: string;
		comparator: RangeCheck['Comparator'];
		values: string[];
	}[];
}

interface EnhancedWhereClauseResult extends WhereClauseResult {
	context: {
		dtype?: string;
		analysisFlags?: { [flag: string]: string[] };
		visitVariables?: { [variable: string]: string[] };
		criterionFlags?: { [flag: string]: string[] };
		occurrenceFlags?: { [flag: string]: string[] };
	};
}

function buildParamcdMapping(define: ParsedDefineXML, datasetName: string): Map<string, string> {
	const paramcdToParamMap = new Map<string, string>();
	const normalizedDatasetName = normalizeDatasetId(datasetName);

	const paramcdItemDef = define.ItemDefs.find((def) => {
		const parts = def.OID?.split('.');
		return (
			parts?.[0] === 'IT' &&
			normalizeDatasetId(parts?.[1] || '') === normalizedDatasetName &&
			parts?.[2] === 'PARAMCD'
		);
	});

	if (paramcdItemDef?.CodeListOID) {
		const codeList = define.CodeLists.find((cl) => cl.OID === paramcdItemDef.CodeListOID);
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

function processWhereClause(
	whereClauseOID: string,
	whereClauseDefs: WhereClauseDef[],
	datasetName: string
): EnhancedWhereClauseResult | null {
	// Find the matching WhereClauseDef
	const whereClause = whereClauseDefs.find((def) => def.OID === whereClauseOID);
	if (!whereClause) {
		console.warn(`No WhereClauseDef found for OID: ${whereClauseOID}`);
		return null;
	}

	// Initialize result with additional context
	const result: EnhancedWhereClauseResult = {
		paramcd: [],
		conditions: [],
		context: {
			dtype: undefined,
			analysisFlags: {},
			visitVariables: {},
			criterionFlags: {},
			occurrenceFlags: {}
		}
	};

	// Process all RangeChecks (these are combined with AND logic per spec)
	whereClause.RangeChecks.forEach((check) => {
		// Extract dataset and variable from ItemOID (format: IT.{dataset}.{variable})
		const itemParts = check.ItemOID.split('.');
		if (itemParts.length !== 3) {
			console.warn(`Invalid ItemOID format in WhereClauseDef ${whereClauseOID}: ${check.ItemOID}`);
			return;
		}

		const [prefix, checkDataset, variable] = itemParts;

		// Validate this RangeCheck belongs to our dataset
		if (normalizeDatasetId(checkDataset) !== normalizeDatasetId(datasetName)) {
			console.warn(
				`Dataset mismatch in WhereClauseDef ${whereClauseOID}: expected ${datasetName}, got ${checkDataset}`
			);
			return;
		}

		// Build condition
		const condition = {
			variable,
			comparator: check.Comparator,
			values: check.CheckValues
		};
		result.conditions.push(condition);

		// Special handling for different variable types
		if (variable === 'PARAMCD' && (check.Comparator === 'EQ' || check.Comparator === 'IN')) {
			result.paramcd.push(...check.CheckValues);
		}
		// Handle special ADaM variables that create duplicate records
		else if (variable === 'DTYPE' && check.Comparator === 'EQ' && check.CheckValues.length > 0) {
			result.context.dtype = check.CheckValues[0];
		} else if (variable.match(/^ANL\d+FL$/) && check.CheckValues.length > 0) {
			// Analysis flags like ANL01FL, ANL02FL, etc.
			result.context.analysisFlags[variable] = check.CheckValues;
		} else if (variable.match(/^AVISIT/) && check.CheckValues.length > 0) {
			// Visit variables like AVISIT, AVISITN
			result.context.visitVariables[variable] = check.CheckValues;
		} else if (variable.match(/^CRIT\d+/) && check.CheckValues.length > 0) {
			// Criterion flags
			result.context.criterionFlags[variable] = check.CheckValues;
		} else if (isOccurrenceFlag(variable) && check.CheckValues.length > 0) {
			// Occurrence flags like ONTRTFL, POSTTRTFL, etc.
			result.context.occurrenceFlags[variable] = check.CheckValues;
		}
	});

	return result;
}

// Helper function to identify occurrence flags
function isOccurrenceFlag(variable: string): boolean {
	const occurrenceFlagPatterns = [
		/ONTRTFL$/, // On treatment flag
		/POSTTRTFL$/, // Post-treatment flag
		/ABLFL$/, // Analysis baseline flag
		/ASEQ$/ // Analysis sequence number
	];

	return occurrenceFlagPatterns.some((pattern) => pattern.test(variable));
}

function findValueListDefs(define: ParsedDefineXML, datasetName: string): ValueListDef[] {
	const normalizedDatasetName = normalizeDatasetId(datasetName);
	const uniqueOIDs = new Set();
	return define.ValueListDefs.filter((def) => {
		const parts = def.OID?.split('.') || [];
		if (parts[0] === 'VL' && normalizeDatasetId(parts[1] || '') === normalizedDatasetName) {
			if (!uniqueOIDs.has(def.OID)) {
				uniqueOIDs.add(def.OID);
				return true;
			}
		}
		return false;
	});
}

function processOriginInfo(itemDef: ItemDef): OriginInfo | undefined {
	if (!itemDef.OriginType && !itemDef.Origin) return undefined;

	return {
		type: itemDef.OriginType || '',
		source: itemDef.Origin || null,
		description: itemDef.Description || null,
		translatedText: (itemDef as any).OriginTranslatedText || null
	};
}

// Enhanced processValueLevelMetadata function that works with any dataset
export function processValueLevelMetadata(
	define: ParsedDefineXML,
	datasetName: string
): ProcessedVLM {
	console.log('Starting VLM processing:', {
		datasetName,
		defineKeys: Object.keys(define)
	});

	const result: ProcessedVLM = {
		dataset: datasetName,
		variables: new Map()
	};

	// Build PARAMCD to PARAM mapping
	const paramcdToParamMap = buildParamcdMapping(define, datasetName);
	console.log('PARAMCD mapping:', Array.from(paramcdToParamMap.entries()));

	// Find ValueListDefs for this dataset
	const valueListDefs = findValueListDefs(define, datasetName);
	console.log('Found ValueListDefs:', {
		count: valueListDefs.length,
		valueListDefs: valueListDefs.map((vl) => vl.OID)
	});

	// Process each ValueListDef
	valueListDefs.forEach((valueListDef) => {
		if (!valueListDef.OID) return;

		const variable = valueListDef.OID.split('.')[2];
		if (!variable) return;

		let vlmVariable = result.variables.get(variable);
		console.log('Processing VLM Variable:', {
			variable,
			existing: !!vlmVariable,
			itemRefs: valueListDef.ItemRefs?.length || 0
		});

		if (!vlmVariable) {
			vlmVariable = {
				name: variable,
				valueListDef: {
					OID: valueListDef.OID,
					ItemRefs: []
				}
			};
			result.variables.set(variable, vlmVariable);
		}

		const itemRefs = processValueListDefs(valueListDef, define, paramcdToParamMap, datasetName);
		console.log('Processed ItemRefs:', {
			variable,
			count: itemRefs.length,
			sample: itemRefs.length > 0 ? itemRefs[0] : null
		});

		vlmVariable.valueListDef.ItemRefs.push(...itemRefs);
	});

	// Ensure we have PARAM variable if PARAMCD is available
	if (paramcdToParamMap.size > 0 && !result.variables.has('PARAM')) {
		const paramItemRefs: VLMItemRef[] = Array.from(paramcdToParamMap.entries()).map(
			([paramcd, param], index) =>
				({
					paramcd,
					paramInfo: {
						ordinal: index + 1,
						codedValue: paramcd,
						decode: param,
						isExternal: false
					},
					mandatory: true,
					orderNumber: index + 1
				}) as VLMItemRef
		);

		result.variables.set('PARAM', {
			name: 'PARAM',
			valueListDef: {
				OID: `VL.${datasetName}.PARAM`,
				ItemRefs: paramItemRefs
			}
		});
	}

	// Log the final result for debugging
	console.log('Final VLM structure:', {
		dataset: result.dataset,
		variableCount: result.variables.size,
		variables: Array.from(result.variables.keys()),
		sampleItemRef:
			result.variables.size > 0
				? Array.from(result.variables.values())[0]?.valueListDef?.ItemRefs?.[0]
				: null
	});

	return result;
}

// Process ValueListDefs to create ItemRefs
function processValueListDefs(
	valueListDef: ValueListDef,
	define: ParsedDefineXML,
	paramcdToParamMap: Map<string, string>,
	datasetName: string
): VLMItemRef[] {
	const itemRefs: VLMItemRef[] = [];

	if (!valueListDef.ItemRefs) {
		console.log('No ItemRefs found in ValueListDef');
		return itemRefs;
	}

	valueListDef.ItemRefs.forEach((itemRef) => {
		if (!itemRef.WhereClauseOID) {
			console.log('No WhereClauseOID found');
			return;
		}

		const whereClauseResult = processWhereClause(
			itemRef.WhereClauseOID,
			define.WhereClauseDefs,
			datasetName
		) as EnhancedWhereClauseResult | null;

		if (!whereClauseResult) {
			console.warn(`No WhereClauseResult for WhereClauseOID: ${itemRef.WhereClauseOID}`);
			return;
		}

		// Find the ItemDef
		const itemDef = define.ItemDefs.find((def) => def.OID === itemRef.OID);
		if (!itemDef) {
			console.warn(`ItemDef not found for OID: ${itemRef.OID}`);
			return;
		}

		// Get codelist info if available
		let codelistInfo: any | undefined;
		if (itemDef.CodeListOID) {
			const codeList = define.CodeLists.find((cl) => cl.OID === itemDef.CodeListOID);
			if (codeList) {
				codelistInfo = {
					OID: codeList.OID,
					name: codeList.Name,
					items: codeList.CodeListItems?.map((item) => ({
						codedValue: item.CodedValue,
						decode: item.Decode?.TranslatedText || '',
						isExtended: item.ExtendedValue === true
					}))
				};
			}
		}

		// If no PARAMCD values found in the WhereClause, create a non-parameterized entry
		if (whereClauseResult.paramcd.length === 0) {
			console.log(
				`No PARAMCD found for WhereClauseOID: ${itemRef.WhereClauseOID}, creating non-parameterized entry`
			);

			// Create a non-parameterized ItemRef
			const nonParamItemRef: VLMItemRef = {
				paramcd: '*', // Special marker for non-parameterized entries
				paramInfo: {
					ordinal: 0,
					codedValue: '*',
					decode: 'Non-Parameter Specific',
					isExternal: false
				},
				whereClause: {
					comparator: whereClauseResult.conditions[0].comparator,
					checkValues: whereClauseResult.conditions[0].values,
					whereClauseOID: itemRef.WhereClauseOID || '',
					OID: itemRef.OID || '',
					source: {
						domain: datasetName,
						variable: whereClauseResult.conditions[0].variable
					}
				},
				method: itemRef.MethodOID
					? methodUtils.processMethod(itemRef.MethodOID, define.Methods)
					: undefined,
				methodOID: itemRef.MethodOID || undefined,
				valueListOID: valueListDef.OID || undefined,
				OID: itemDef.OID || undefined,
				codelist: codelistInfo,
				origin: processOriginInfo(itemDef),
				itemDescription: itemDef.Description,
				mandatory: itemRef.Mandatory === 'Yes',
				orderNumber: parseInt(itemRef.OrderNumber || '0', 10),
				sources: {},
				isNonParameterized: true,

				// Add context properties from the WhereClause
				...buildSpecialProperties(whereClauseResult)
			};

			itemRefs.push(nonParamItemRef);
			return;
		}

		// Regular processing for parameter-specific ItemRefs
		whereClauseResult.paramcd.forEach((paramcd) => {
			const vlmItemRef: VLMItemRef = {
				paramcd,
				paramInfo: {
					ordinal: parseInt(itemRef.OrderNumber || '0', 10),
					codedValue: paramcd,
					decode: paramcdToParamMap.get(paramcd) || '',
					isExternal: false
				},
				whereClause: {
					comparator: whereClauseResult.conditions[0].comparator,
					checkValues: whereClauseResult.conditions[0].values,
					whereClauseOID: itemRef.WhereClauseOID || '',
					OID: itemRef.OID || '',
					source: {
						domain: datasetName,
						variable: whereClauseResult.conditions[0].variable
					}
				},
				method: itemRef.MethodOID
					? methodUtils.processMethod(itemRef.MethodOID, define.Methods)
					: undefined,
				methodOID: itemRef.MethodOID || undefined,
				valueListOID: valueListDef.OID || undefined,
				OID: itemDef.OID || undefined,
				codelist: codelistInfo,
				origin: processOriginInfo(itemDef),
				itemDescription: itemDef.Description,
				mandatory: itemRef.Mandatory === 'Yes',
				orderNumber: parseInt(itemRef.OrderNumber || '0', 10),
				sources: {},

				// Add context properties from the WhereClause
				...buildSpecialProperties(whereClauseResult)
			};

			itemRefs.push(vlmItemRef);
		});
	});

	return itemRefs;
}

// Helper to build special properties from a WhereClause result
function buildSpecialProperties(whereClauseResult: EnhancedWhereClauseResult): Partial<VLMItemRef> {
	const props: Partial<VLMItemRef> = {};

	// Add DTYPE if available
	if (whereClauseResult.context?.dtype) {
		props.dtype = whereClauseResult.context.dtype;
	}

	// Add analysis flags if available
	if (
		whereClauseResult.context?.analysisFlags &&
		Object.keys(whereClauseResult.context.analysisFlags).length > 0
	) {
		props.analysisFlags = Object.entries(whereClauseResult.context.analysisFlags).map(
			([flag, values]) => `${flag}=${values.join(',')}`
		);
	}

	// Add visit context if available
	if (
		whereClauseResult.context?.visitVariables &&
		Object.keys(whereClauseResult.context.visitVariables).length > 0
	) {
		props.visitContext = Object.keys(whereClauseResult.context.visitVariables)
			.map((v) => v)
			.join(',');
	}

	// Add special variables
	const specialVars: Record<string, string> = {};

	if (whereClauseResult.context?.dtype) {
		specialVars.DTYPE = whereClauseResult.context.dtype;
	}

	Object.entries(whereClauseResult.context?.analysisFlags || {}).forEach(([flag, values]) => {
		specialVars[flag] = values.join(',');
	});

	Object.entries(whereClauseResult.context?.visitVariables || {}).forEach(([variable, values]) => {
		specialVars[variable] = values.join(',');
	});

	Object.entries(whereClauseResult.context?.criterionFlags || {}).forEach(([flag, values]) => {
		specialVars[flag] = values.join(',');
	});

	Object.entries(whereClauseResult.context?.occurrenceFlags || {}).forEach(([flag, values]) => {
		specialVars[flag] = values.join(',');
	});

	if (Object.keys(specialVars).length > 0) {
		props.specialVariables = specialVars;
	}

	return props;
}
