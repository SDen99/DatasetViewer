// src/lib/core/processors/defineXML/VLMProcessingLogic.ts
import type { WhereClauseDef, RangeCheck } from '$lib/types/define-xml';
import type { MethodInfo } from '$lib/types/define-xml/methods';
import type { ValueListDef } from '$lib/types/define-xml/valuelists';
import type { ParsedDefineXML } from '$lib/types/define-xml';
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
	whereClause?: VLMWhereClause;
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

interface WhereClauseResult {
	paramcd: string[];
	conditions: {
		variable: string;
		comparator: RangeCheck['Comparator'];
		values: string[];
	}[];
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

function processWhereClause(
	whereClauseOID: string,
	whereClauseDefs: WhereClauseDef[],
	datasetName: string
): WhereClauseResult | null {
	// Find the matching WhereClauseDef
	const whereClause = whereClauseDefs.find((def) => def.OID === whereClauseOID);
	if (!whereClause) {
		console.warn(`No WhereClauseDef found for OID: ${whereClauseOID}`);
		return null;
	}

	// Initialize result
	const result: WhereClauseResult = {
		paramcd: [],
		conditions: []
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

		// If this is a PARAMCD condition, add to paramcd array
		if (variable === 'PARAMCD') {
			if (check.Comparator === 'EQ') {
				result.paramcd.push(...check.CheckValues);
			} else if (check.Comparator === 'IN') {
				result.paramcd.push(...check.CheckValues);
			}
			// Note: We ignore NE and NOTIN for PARAMCD as they're typically not used for direct mapping
		}

		result.conditions.push(condition);
	});

	// If we didn't find any valid conditions, return null
	if (result.conditions.length === 0) {
		console.warn(`No valid conditions found in WhereClauseDef ${whereClauseOID}`);
		return null;
	}

	return result;
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
		Type: method.Type || null,
		Description: method.Description || null,
		Document: method.Document,
		TranslatedText: method.TranslatedText || null
	};
}

function processValueListDefs(
	valueListDef: ValueListDef,
	define: ParsedDefineXML,
	paramcdToParamMap: Map<string, string>,
	datasetName: string
): VLMItemRef[] {
	const itemRefs: VLMItemRef[] = [];

	if (!valueListDef.ItemRefs) {
		return itemRefs;
	}

	valueListDef.ItemRefs.forEach((itemRef) => {
		if (!itemRef.WhereClauseOID) {
			return;
		}

		const whereClauseResult = processWhereClause(
			itemRef.WhereClauseOID,
			define.WhereClauseDefs,
			datasetName
		);

		if (!whereClauseResult || whereClauseResult.paramcd.length === 0) {
			console.warn(`No PARAMCD found for WhereClauseOID: ${itemRef.WhereClauseOID}`);
			return;
		}

		const itemDef = define.ItemDefs.find((def) => def.OID === itemRef.ItemOID);
		if (!itemDef) {
			console.warn(`ItemDef not found for ItemOID: ${itemRef.ItemOID}`);
			return;
		}

		// Create an ItemRef for each PARAMCD value
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
					itemOID: itemRef.ItemOID,
					source: {
						domain: datasetName,
						variable: whereClauseResult.conditions[0].variable
					}
				},
				method: itemRef.MethodOID
					? methodUtils.processMethod(itemRef.MethodOID, define.Methods)
					: undefined,
				origin: processOriginInfo(itemDef),
				itemDescription: itemDef.Description,
				mandatory: itemRef.Mandatory === 'Yes',
				orderNumber: parseInt(itemRef.OrderNumber || '0', 10),
				sources: {}
			};

			itemRefs.push(vlmItemRef);
		});
	});

	return itemRefs;
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
	const valueListDefs = findValueListDefs(define, datasetName);

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

	return result;
}
