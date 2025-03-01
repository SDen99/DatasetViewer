// value-list-finder.ts - Module to find ValueListDefs for a dataset

import type { ParsedDefineXML, ValueListDef } from '$lib/types/define-xml';
import { normalizeDatasetId } from '$lib/core/utils/datasetUtils';

/**
 * Finds all ValueListDefs for a given dataset
 * @param define The parsed Define-XML document
 * @param datasetName The name of the dataset to find ValueListDefs for
 * @returns An array of ValueListDefs for the dataset
 */
export function findValueListDefs(define: ParsedDefineXML, datasetName: string): ValueListDef[] {
	console.log('Finding ValueListDefs for dataset:', datasetName);
	const normalizedDatasetName = normalizeDatasetId(datasetName);
	const uniqueOIDs = new Set();

	const valueListDefs = define.ValueListDefs.filter((def) => {
		const parts = def.OID?.split('.') || [];
		if (
			parts.length >= 3 &&
			parts[0] === 'VL' &&
			normalizeDatasetId(parts[1] || '') === normalizedDatasetName
		) {
			if (!uniqueOIDs.has(def.OID)) {
				uniqueOIDs.add(def.OID);
				return true;
			}
		}
		return false;
	});

	console.log(`Found ${valueListDefs.length} ValueListDefs for dataset ${datasetName}`);

	if (valueListDefs.length > 0) {
		console.log('Value List Definitions found:');
		console.table(
			valueListDefs.map((vl) => {
				const parts = vl.OID?.split('.') || [];
				return {
					OID: vl.OID,
					Variable: parts.length >= 3 ? parts[2] : 'unknown',
					ItemRefCount: vl.ItemRefs?.length || 0,
					Description: vl.Description || 'No description'
				};
			})
		);
	}

	return valueListDefs;
}
