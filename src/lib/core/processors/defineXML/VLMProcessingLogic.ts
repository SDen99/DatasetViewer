import type { ParsedDefineXML, valueListDef, whereClauseDef, method } from './types';
import { normalizeDatasetId } from '$lib/core/utils/datasetUtils';

export interface ProcessedVLM {
	dataset: string;
	variables: Map<string, VLMVariable>;
}

export interface VLMItemRef {
	paramcd: string;
	whereClause?: {
		comparator: string;
		checkValues: string[];
		itemOID?: string; // Reference to source item
		source?: {
			domain: string;
			variable: string;
		};
	};
	method?: {
		description: string;
		document?: string;
	};
	mandatory: boolean;
	orderNumber: number;
	sources?: {
		[variable: string]: {
			domain?: string;
			variable?: string;
			type?: string; // 'direct' | 'derived' | 'predecessor'
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

function getDatasetFromOID(oid: string | null): string | null {
	if (!oid) return null;
	// Extract dataset name from patterns like:
	// VL.DATASET.VARIABLE
	// IT.DATASET.VARIABLE
	const parts = oid.split('.');
	return parts.length >= 2 ? parts[1] : null;
}

function processWhereClause(
	whereClauseOID: string | null,
	whereClauseDefs: whereClauseDef[]
): VLMItemRef['whereClause'] | undefined {
	if (!whereClauseOID) return undefined;

	const whereClause = whereClauseDefs.find((wc) => wc.OID === whereClauseOID);
	if (!whereClause) return undefined;

	return {
		comparator: whereClause.Comparator || 'EQ',
		checkValues: whereClause.CheckValues
			? whereClause.CheckValues.split(',').map((v) => v.trim())
			: []
	};
}

function processMethod(
	methodOID: string | null,
	methods: method[]
): VLMItemRef['method'] | undefined {
	if (!methodOID) return undefined;

	const method = methods.find((m) => m.OID === methodOID);
	if (!method) return undefined;

	return {
		description: method.Description || '',
		document: method.Document
	};
}

export function processValueLevelMetadata(
	define: ParsedDefineXML,
	datasetName: string
): ProcessedVLM {
	const normalizedDatasetName = normalizeDatasetId(datasetName);

	console.log('Processing VLM for dataset:', {
		input: datasetName,
		normalized: normalizedDatasetName,
		totalValueListDefs: define.valueListDefs.length
	});

	const result: ProcessedVLM = {
		dataset: datasetName,
		variables: new Map()
	};

	// Helper to process where clause definitions
	function processWhereClause(whereClauseOID: string | null): WhereClauseInfo | undefined {
		if (!whereClauseOID) return undefined;

		const whereClauseDef = define.whereClauseDefs.find((wc) => wc.OID === whereClauseOID);
		if (!whereClauseDef) {
			console.warn(`WhereClause not found for OID: ${whereClauseOID}`);
			return undefined;
		}

		console.log(`Processing WhereClause: ${whereClauseOID}`);

		return {
			comparator: whereClauseDef.Comparator || 'EQ',
			checkValues: whereClauseDef.CheckValues
				? whereClauseDef.CheckValues.split(',').map((v) => v.trim())
				: [],
			itemOID: whereClauseDef.ItemOID,
			sourceItemDef: define.itemDefs.find((item) => item.OID === whereClauseDef.ItemOID)
		};
	}

	// Helper to process method definitions
	function processMethod(methodOID: string | null): MethodInfo | undefined {
		if (!methodOID) return undefined;

		const method = define.methods.find((m) => m.OID === methodOID);
		if (!method) {
			console.warn(`Method not found for OID: ${methodOID}`);
			return undefined;
		}

		return {
			description: method.Description || '',
			document: method.Document,
			type: method.Type || null
		};
	}

	// Helper to find dataset items by name
	function findDatasetItems(datasetName: string, itemName: string) {
		const itemGroup = define.itemGroups.find((ig) => ig.Name === datasetName);
		if (!itemGroup) return undefined;

		return itemGroup.items?.find((item) => item.Name === itemName);
	}

	// Helper to process origins and predecessor information
	function processOrigins(itemDef: ItemDef): OriginInfo[] {
		if (!itemDef.Origin) return [];

		// Handle both single Origin and array of Origins
		const origins = Array.isArray(itemDef.Origin) ? itemDef.Origin : [itemDef.Origin];

		return origins.map((origin) => ({
			type: origin.Type,
			source: origin.Source || null,
			description: origin.Description || null
		}));
	}

	// Helper to decode parameter values using codelists
	function decodeParameter(paramcd: string): string | null {
		// Find the parameter codelist
		const paramItemDef = define.itemDefs.find((item) => item.Name === 'PARAM' && item.CodeListRef);

		if (!paramItemDef?.CodeListRef?.CodeListOID) return null;

		const codeList = define.CodeLists.find((cl) => cl.OID === paramItemDef.CodeListRef.CodeListOID);

		if (!codeList) return null;

		// Find the matching codelist item
		const codeListItem = codeList.CodeListItems?.find((item) => item.CodedValue === paramcd);

		return codeListItem?.Decode?.TranslatedText || null;
	}

	// Find ValueListDefs for this dataset
	const datasetValueListDefs = define.valueListDefs.filter((vld) => {
		const vlDataset = getDatasetFromOID(vld.OID);
		const matches = vlDataset && normalizeDatasetId(vlDataset) === normalizedDatasetName;

		console.log('Checking ValueListDef:', {
			OID: vld.OID,
			dataset: vlDataset,
			normalized: vlDataset ? normalizeDatasetId(vlDataset) : null,
			targetDataset: normalizedDatasetName,
			matches
		});

		return matches;
	});

	// Group ValueListDefs by variable
	const valueListsByVariable = new Map<string, valueListDef[]>();
	datasetValueListDefs.forEach((vld) => {
		const parts = vld.OID?.split('.');
		const variable = parts?.[2]; // VL.dataset.variable
		if (variable) {
			const existingList = valueListsByVariable.get(variable) || [];
			existingList.push(vld);
			valueListsByVariable.set(variable, existingList);
		}
	});

	function buildSourcesFromWhereClause(whereClause: any, itemDef: any) {
		if (!whereClause || !whereClause.sourceItemDef) return {};

		const [domain, variable] = whereClause.sourceItemDef.OID.split('.');
		return {
			[variable]: {
				domain: domain,
				variable: variable,
				type: 'direct'
			}
		};
	}

	function buildSourcesFromOrigins(origins: OriginInfo[]) {
		return origins.reduce((acc, origin) => {
			if (origin.source) {
				const [domain, variable] = origin.source.split('.');
				acc[variable] = {
					domain,
					variable,
					type: origin.type.toLowerCase()
				};
			}
			return acc;
		}, {});
	}

	// Process each variable's VLM
	valueListsByVariable.forEach((vlDefs, variableName) => {
		console.log(`Processing variable: ${variableName} with ${vlDefs.length} ValueListDefs`);

		const vlmVariable: VLMVariable = {
			name: variableName,
			valueListDef: {
				OID: vlDefs[0].OID || '',
				itemRefs: []
			}
		};

		vlDefs.forEach((vld) => {
			if (!vld.WhereClauseOID) return;

			const whereClause = processWhereClause(vld.WhereClauseOID);
			if (!whereClause?.checkValues.length) return;

			const method = processMethod(vld.MethodOID);
			const itemDef = define.itemDefs.find((item) => item.OID === vld.ItemOID);
			const origins = itemDef ? processOrigins(itemDef) : [];

			// Build sources from both where clause and origins
			const sourcesFromWhere = buildSourcesFromWhereClause(whereClause, itemDef);
			const sourcesFromOrigins = buildSourcesFromOrigins(origins);

			const itemRef: VLMItemRef = {
				paramcd: whereClause.checkValues[0],
				whereClause,
				method,
				origins,
				mandatory: vld.Mandatory === 'Yes',
				orderNumber: parseInt(vld.OrderNumber || '0', 10),
				param: decodeParameter(whereClause.checkValues[0]),
				itemDef,
				sources: {
					...sourcesFromWhere,
					...sourcesFromOrigins
				}
			};

			vlmVariable.valueListDef.itemRefs.push(itemRef);
		});

		if (vlmVariable.valueListDef.itemRefs.length > 0) {
			// Sort by order number
			vlmVariable.valueListDef.itemRefs.sort((a, b) => a.orderNumber - b.orderNumber);
			result.variables.set(variableName, vlmVariable);
		}
	});

	console.log('VLM Processing Complete:', {
		variableCount: result.variables.size,
		variables: Array.from(result.variables.keys()),
		sampleItemRefs:
			result.variables.size > 0
				? Array.from(result.variables.values())[0].valueListDef.itemRefs
				: []
	});

	return result;
}

// Helper function to extract dataset name from OID
