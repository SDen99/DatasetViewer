import type { ParsedDefineXML, method, itemDef, whereClauseDef } from './types';
import { normalizeDatasetId } from '$lib/core/utils/datasetUtils';

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

	console.log('Starting to process dataset:', normalizedDatasetName);

	const result: ProcessedVLM = {
		dataset: datasetName,
		variables: new Map()
	};

	// First, collect all PARAMCDs and their corresponding PARAM values
	const paramcdToParamMap = new Map<string, string>();

	// Find the PARAMCD ItemDef and its CodeList
	const paramcdItemDef = define.itemDefs.find((def) => {
		const parts = def.OID?.split('.');
		return (
			parts?.[0] === 'IT' &&
			normalizeDatasetId(parts?.[1] || '') === normalizedDatasetName &&
			parts?.[2] === 'PARAMCD'
		);
	});

	console.log('Found PARAMCD ItemDef:', {
		found: !!paramcdItemDef,
		OID: paramcdItemDef?.OID,
		CodeListOID: paramcdItemDef?.CodeListOID
	});

	if (paramcdItemDef?.CodeListOID) {
		const codeList = define.CodeLists.find((cl) => cl.OID === paramcdItemDef.CodeListOID);

		if (codeList) {
			// Try CodeListItems
			if (codeList.CodeListItems) {
				codeList.CodeListItems.forEach((item) => {
					if (item.CodedValue && item.Decode?.TranslatedText) {
						paramcdToParamMap.set(item.CodedValue, item.Decode.TranslatedText);
					}
				});
			}

			// Try EnumeratedItems
			if (codeList.EnumeratedItems) {
				codeList.EnumeratedItems.forEach((item) => {
					if (item.CodedValue && item.Decode?.TranslatedText) {
						paramcdToParamMap.set(item.CodedValue, item.Decode.TranslatedText);
					}
				});
			}
		}
	}

	console.log('PARAMCD to PARAM mappings:', {
		count: paramcdToParamMap.size,
		mappings: Array.from(paramcdToParamMap.entries())
	});

	// Process each ValueListDef
	define.valueListDefs.forEach((vlDef) => {
		const [prefix, dataset, variableName] = vlDef.OID?.split('.') || [];

		if (prefix !== 'VL' || normalizeDatasetId(dataset) !== normalizedDatasetName) {
			return;
		}

		// Find the ItemDef for this VLDef
		const itemDef = define.itemDefs.find((def) => def.OID === vlDef.ItemOID);
		if (!itemDef) {
			console.log('No ItemDef found for:', {
				VLDefOID: vlDef.OID,
				ItemOID: vlDef.ItemOID
			});
			return;
		}

		// Get or create variable entry
		let vlmVariable = result.variables.get(variableName);
		if (!vlmVariable) {
			vlmVariable = {
				name: variableName,
				valueListDef: {
					OID: vlDef.OID || '',
					itemRefs: []
				}
			};
			result.variables.set(variableName, vlmVariable);
		}

		// Process where clause and get PARAMCD
		const whereClause = vlDef.WhereClauseOID
			? processWhereClause(vlDef.WhereClauseOID, define.whereClauseDefs)
			: undefined;

		if (!whereClause?.checkValues?.length) {
			console.log('No check values for:', {
				variable: variableName,
				whereClauseOID: vlDef.WhereClauseOID
			});
			return;
		}

		const paramcd = whereClause.checkValues[0];
		const paramDecode = paramcdToParamMap.get(paramcd);

		console.log('Creating ItemRef:', {
			variable: variableName,
			paramcd,
			hasParamDecode: !!paramDecode,
			paramDecode
		});

		// Create itemRef
		const itemRef: VLMItemRef = {
			paramcd,
			paramInfo: {
				ordinal: 0,
				codedValue: paramcd,
				decode: paramDecode || '',
				isExternal: false
			},
			whereClause,
			method: vlDef.MethodOID ? processMethod(vlDef.MethodOID, define.methods) : undefined,
			origin: processOriginInfo(itemDef),
			itemDescription: itemDef.Description,
			mandatory: vlDef.Mandatory === 'Yes',
			orderNumber: parseInt(vlDef.OrderNumber || '0', 10),
			sources: {}
		};

		if (whereClause?.source) {
			itemRef.sources[whereClause.source.variable] = {
				domain: whereClause.source.domain,
				variable: whereClause.source.variable
			};
		}

		vlmVariable.valueListDef.itemRefs.push(itemRef);
	});

	// Log final result
	console.log('Processing complete:', {
		variables: Array.from(result.variables.keys()),
		itemRefCounts: Array.from(result.variables.entries()).map(([name, variable]) => ({
			variable: name,
			itemRefs: variable.valueListDef.itemRefs.length
		}))
	});

	return result;
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
