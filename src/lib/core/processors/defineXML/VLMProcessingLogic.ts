import type { ParsedDefineXML, method, itemDef, whereClauseDef, valueListDef } from './types';
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
	translatedText?: string | null;
}

export interface MethodInfo {
	type: string | null;
	description: string | null;
	document?: string;
	translatedText?: string | null;
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

function buildParamcdMapping(define: ParsedDefineXML, datasetName: string): Map<string, string> {
	const paramcdToParamMap = new Map<string, string>();
	const normalizedDatasetName = normalizeDatasetId(datasetName);

	const paramcdItemDef = define.itemDefs.find((def) => {
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

function findValueListDefs(define: ParsedDefineXML, datasetName: string): valueListDef[] {
	const normalizedDatasetName = normalizeDatasetId(datasetName);
	const uniqueOIDs = new Set();
	return define.valueListDefs.filter((def) => {
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

function processWhereClause(
	whereClauseOID: string,
	whereClauseDefs: whereClauseDef[],
	paramcdToParamMap: Map<string, string>,
	datasetName: string
): string[] {
	//console.log('\nProcessing WhereClause:', whereClauseOID);

	const normalizedDatasetName = normalizeDatasetId(datasetName);
	const pattern = new RegExp(`WC\\.${normalizedDatasetName}\\.PARAMCD\\.(EQ|IN)\\.(.+)$`);
	const match = whereClauseOID.match(pattern);

	if (!match) {
		//	console.log('No match found for WhereClause pattern');
		return [];
	}

	const [, comparator, paramList] = match;

	if (comparator === 'EQ') {
		return [paramList];
	} else {
		const params: string[] = [];
		let remaining = paramList;
		const validParamcds = Array.from(paramcdToParamMap.keys());

		while (remaining.length > 0) {
			let found = false;
			let longestMatch = '';
			for (const paramcd of validParamcds) {
				if (remaining.startsWith(paramcd) && paramcd.length > longestMatch.length) {
					longestMatch = paramcd;
					found = true;
				}
			}
			if (!found) break;

			params.push(longestMatch);
			remaining = remaining.slice(longestMatch.length);
		}

		//console.log('Extracted PARAMCDs:', params);
		return params;
	}
}

function processValueListDefs(
	valueListDef: valueListDef,
	define: ParsedDefineXML,
	paramcdToParamMap: Map<string, string>,
	datasetName: string
): VLMItemRef[] {
	/*console.log(
		`\nProcessing ValueListDef ${valueListDef.OID} with ${valueListDef.ItemRefs?.length || 0} ItemRefs`
	); */
	const itemRefs: VLMItemRef[] = [];

	if (!valueListDef.ItemRefs) {
		//	console.log('No ItemRefs found in ValueListDef');
		return itemRefs;
	}

	valueListDef.ItemRefs.forEach((itemRef, index) => {
		/*	console.log(`\nProcessing ItemRef ${index + 1}:`, {
			ItemOID: itemRef.ItemOID,
			WhereClauseOID: itemRef.WhereClauseOID,
			Mandatory: itemRef.Mandatory,
			MethodOID: itemRef.MethodOID
		}); */

		if (!itemRef.WhereClauseOID) {
			console.log('No WhereClauseOID found for ItemRef');
			return;
		}

		const paramcds = processWhereClause(
			itemRef.WhereClauseOID,
			define.whereClauseDefs,
			paramcdToParamMap,
			datasetName
		);

		//console.log('Found PARAMCDs for ItemRef:', paramcds);

		const itemDef = define.itemDefs.find((def) => def.OID === itemRef.ItemOID);

		if (!itemDef) {
			//	console.log('No ItemDef found for:', itemRef.ItemOID);
			return;
		}

		paramcds.forEach((paramcd) => {
			itemRefs.push({
				paramcd,
				paramInfo: {
					ordinal: parseInt(itemRef.OrderNumber || '0', 10),
					codedValue: paramcd,
					decode: paramcdToParamMap.get(paramcd) || '',
					isExternal: false
				},
				method: itemRef.MethodOID ? processMethod(itemRef.MethodOID, define.methods) : undefined,
				origin: processOriginInfo(itemDef),
				itemDescription: itemDef.Description,
				mandatory: itemRef.Mandatory === 'Yes',
				orderNumber: parseInt(itemRef.OrderNumber || '0', 10),
				sources: {}
			});
		});
	});
	/*
	console.log(
		`Completed processing ValueListDef ${valueListDef.OID}, created ${itemRefs.length} itemRefs`
	);
*/ return itemRefs;
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

export function processValueLevelMetadata(
	define: ParsedDefineXML,
	datasetName: string
): ProcessedVLM {
	const result: ProcessedVLM = {
		dataset: datasetName,
		variables: new Map()
	};

	const paramcdToParamMap = buildParamcdMapping(define, datasetName);
	//console.log('PARAMCD to PARAM mappings:', Array.from(paramcdToParamMap.entries()));

	const valueListDefs = findValueListDefs(define, datasetName);
	/*	console.log(
		'Found ValueListDefs with ItemRefs:',
		valueListDefs.map((def) => ({
			OID: def.OID,
			ItemRefCount: def.ItemRefs?.length || 0
		}))
	);*/

	valueListDefs.forEach((valueListDef) => {
		if (!valueListDef.OID) return;

		const variable = valueListDef.OID.split('.')[2];
		if (!variable) return;

		let vlmVariable = result.variables.get(variable);
		if (!vlmVariable) {
			vlmVariable = {
				name: variable,
				valueListDef: {
					OID: valueListDef.OID,
					itemRefs: []
				}
			};
			result.variables.set(variable, vlmVariable);
		}

		const itemRefs = processValueListDefs(valueListDef, define, paramcdToParamMap, datasetName);
		vlmVariable.valueListDef.itemRefs.push(...itemRefs);
	});

	/*	console.log('Processing complete:', {
		variables: Array.from(result.variables.entries()).map(([name, variable]) => ({
			variable: name,
			itemRefs: variable.valueListDef.itemRefs.map((ref) => ({
				paramcd: ref.paramcd,
				decode: ref.paramInfo?.decode
			}))
		}))
	});
*/
	return result;
}
