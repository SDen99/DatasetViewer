import type { ParsedDefineXML, method, itemDef, whereClauseDef } from './types';
import { normalizeDatasetId } from '$lib/core/utils/datasetUtils';

// Enhanced interfaces
export interface OriginInfo {
	type: string;
	source: string | null;
	description?: string | null;
	translatedText?: string | null; // Add translated text from Origin
}

export interface MethodInfo {
	type: string | null;
	description: string | null;
	document?: string;
	translatedText?: string | null; // Add translated text from Method
}

export interface VLMItemRef {
	paramcd: string;
	paramInfo?: CodeListInfo;
	whereClause?: {
		comparator: string;
		checkValues: string[];
		itemOID?: string;
		source?: {
			domain: string;
			variable: string;
		};
	};
	method?: MethodInfo;
	origin?: OriginInfo;
	itemDescription?: string | null; // Add ItemDef description
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
}

export interface VLMVariable {
	name: string;
	valueListDef: {
		OID: string;
		itemRefs: VLMItemRef[];
	};
	origin?: string;
	codeList?: string;
}

export interface ProcessedVLM {
	dataset: string;
	variables: Map<string, VLMVariable>;
}

export function processValueLevelMetadata(
	define: ParsedDefineXML,
	datasetName: string
): ProcessedVLM {
	const normalizedDatasetName = normalizeDatasetId(datasetName);

	console.log('Starting VLM processing for:', {
		datasetName,
		normalized: normalizedDatasetName,
		totalValueListDefs: define.valueListDefs.length
	});

	const result: ProcessedVLM = {
		dataset: datasetName,
		variables: new Map()
	};

	// First, find the ItemDef for the dataset itself to get its ItemRef list
	const datasetItemDef = define.itemDefs.find((itemDef) => {
		// Dataset ItemDefs typically have OIDs like "IT.datasetname"
		const oidParts = itemDef.OID.split('.');
		return oidParts[0] === 'IT' && normalizeDatasetId(oidParts[1]) === normalizedDatasetName;
	});

	if (!datasetItemDef) {
		console.log('No ItemDef found for dataset:', normalizedDatasetName);
		return result;
	}

	// Process each variable in the dataset that has VLM
	define.valueListDefs.forEach((vlDef) => {
		// ValueListDef OIDs are typically in format "VL.dataset.variable"
		const oidParts = vlDef.OID.split('.');
		if (oidParts[0] !== 'VL' || normalizeDatasetId(oidParts[1]) !== normalizedDatasetName) {
			return;
		}

		const variableName = oidParts[2];
		console.log(`Processing VLM for variable: ${variableName}`);

		// Find or create the VLMVariable entry
		let vlmVariable = result.variables.get(variableName);
		if (!vlmVariable) {
			vlmVariable = {
				name: variableName,
				valueListDef: {
					OID: vlDef.OID,
					itemRefs: []
				}
			};
			result.variables.set(variableName, vlmVariable);
		}

		// Process the ItemRef if it exists
		if (vlDef.ItemOID) {
			const itemDef = define.itemDefs.find((item) => item.OID === vlDef.ItemOID);
			if (!itemDef) {
				console.warn(`ItemDef not found for OID: ${vlDef.ItemOID}`);
				return;
			}

			// Get the codelist information if available
			let paramInfo: CodeListInfo | undefined;
			if (itemDef.CodeListRef) {
				const codeList = findCodeList(define, itemDef.CodeListRef);
				if (codeList && codeList.CodeListItems) {
					// For VLM, we need to process each potential PARAMCD value
					codeList.CodeListItems.forEach((item) => {
						paramInfo = {
							ordinal: parseInt(item.Rank || '0', 10),
							codedValue: item.CodedValue,
							decode: item.Decode || '',
							isExternal: !!codeList.ExternalCodeList,
							externalCodeList: codeList.ExternalCodeList
								? {
										dictionary: codeList.ExternalCodeList.Dictionary,
										version: codeList.ExternalCodeList.Version
									}
								: undefined
						};
					});
				}
			}

			// Process where clause if it exists
			const whereClause = vlDef.WhereClauseOID
				? processWhereClause(vlDef.WhereClauseOID, define.whereClauseDefs)
				: undefined;

			const method = vlDef.MethodOID ? processMethod(vlDef.MethodOID, define.methods) : undefined;

			const itemRef: VLMItemRef = {
				paramcd: whereClause?.checkValues[0] || '',
				paramInfo,
				whereClause,
				method,
				origin: processOriginInfo(itemDef),
				itemDescription: itemDef.Description || null,
				mandatory: vlDef.Mandatory === 'Yes',
				orderNumber: parseInt(vlDef.OrderNumber || '0', 10),
				sources: {}
			};

			// Add any source variables
			if (whereClause?.source) {
				itemRef.sources[whereClause.source.variable] = {
					domain: whereClause.source.domain,
					variable: whereClause.source.variable
				};
			}

			vlmVariable.valueListDef.itemRefs.push(itemRef);
		}
	});

	// Sort itemRefs by OrderNumber for each variable
	result.variables.forEach((variable) => {
		variable.valueListDef.itemRefs.sort((a, b) => {
			// First try to sort by CodeList ordinal if available
			const aOrd = a.paramInfo?.ordinal || 0;
			const bOrd = b.paramInfo?.ordinal || 0;
			if (aOrd !== bOrd) return aOrd - bOrd;

			// Then by OrderNumber
			if (a.orderNumber !== b.orderNumber) return a.orderNumber - b.orderNumber;

			// Finally by PARAMCD
			return a.paramcd.localeCompare(b.paramcd);
		});
	});

	console.log('VLM Processing Complete:', {
		dataset: normalizedDatasetName,
		variableCount: result.variables.size,
		variables: Array.from(result.variables.keys())
	});

	return result;
}

function findCodeList(define: ParsedDefineXML, codeListRef: string) {
	return define.CodeLists.find((cl) => cl.OID === codeListRef);
}

function processWhereClause(
	whereClauseOID: string,
	whereClauseDefs: whereClauseDef[]
): VLMItemRef['whereClause'] | undefined {
	const whereClause = whereClauseDefs.find((wc) => wc.OID === whereClauseOID);
	if (!whereClause) return undefined;

	const itemOIDParts = whereClause.ItemOID?.split('.') || [];

	return {
		comparator: whereClause.Comparator || 'EQ',
		checkValues: whereClause.CheckValues
			? whereClause.CheckValues.split(',').map((v) => v.trim())
			: [],
		itemOID: whereClause.ItemOID,
		source:
			itemOIDParts.length >= 2
				? {
						domain: itemOIDParts[0],
						variable: itemOIDParts[1]
					}
				: undefined
	};
}
function processOriginInfo(itemDef: itemDef): OriginInfo | undefined {
	if (!itemDef.OriginType && !itemDef.Origin) return undefined;

	return {
		type: itemDef.OriginType || '',
		source: itemDef.Origin,
		description: itemDef.Description || null,
		translatedText: itemDef.OriginTranslatedText || null
	};
}

function processMethod(methodOID: string, methods: method[]): MethodInfo | undefined {
	const method = methods.find((m) => m.OID === methodOID);
	if (!method) return undefined;

	return {
		type: method.Type || null,
		description: method.Description || null,
		document: method.Document,
		translatedText: method.TranslatedText || null
	};
}
