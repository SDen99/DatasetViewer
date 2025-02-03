import type { ParsedDefineXML, valueListDef, whereClauseDef, method } from './types';
import { normalizeDatasetId } from '$lib/core/utils/datasetUtils';

export interface VLMItemRef {
	paramcd: string;
	whereClause?: {
		comparator: string;
		checkValues: string[];
	};
	method?: {
		description: string;
		document?: string;
	};
	mandatory: boolean;
	orderNumber: number;
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

	console.log(
		`Found ${datasetValueListDefs.length} ValueListDefs for dataset ${normalizedDatasetName}`
	);

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

			const whereClause = processWhereClause(vld.WhereClauseOID, define.whereClauseDefs);
			if (!whereClause?.checkValues.length) return;

			const method = processMethod(vld.MethodOID, define.methods);

			console.log(`Adding ItemRef for ${variableName}:`, {
				paramcd: whereClause.checkValues[0],
				mandatory: vld.Mandatory === 'Yes',
				hasMethod: !!method
			});

			vlmVariable.valueListDef.itemRefs.push({
				paramcd: whereClause.checkValues[0],
				whereClause,
				method,
				mandatory: vld.Mandatory === 'Yes',
				orderNumber: parseInt(vld.OrderNumber || '0', 10)
			});
		});

		if (vlmVariable.valueListDef.itemRefs.length > 0) {
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
