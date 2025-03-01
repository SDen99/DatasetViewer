// paramcd-mapper.ts - Module to build mapping between PARAMCD and PARAM values

import type { ParsedDefineXML } from '$lib/types/define-xml';
import { normalizeDatasetId } from '$lib/core/utils/datasetUtils';

/**
 * Builds a mapping from PARAMCD to PARAM values for a given dataset
 * @param define The parsed Define-XML document
 * @param datasetName The name of the dataset to build the mapping for
 * @returns A Map of PARAMCD values to their corresponding PARAM values
 */
export function buildParamcdMapping(
	define: ParsedDefineXML,
	datasetName: string
): Map<string, string> {
	console.log('Building PARAMCD to PARAM mapping for dataset:', datasetName);
	const paramcdToParamMap = new Map<string, string>();
	const normalizedDatasetName = normalizeDatasetId(datasetName);

	// Strategy 1: Get mapping from PARAMCD CodeList
	const paramcdItemDef = define.ItemDefs.find((def) => {
		const parts = def.OID?.split('.');
		return (
			parts?.[0] === 'IT' &&
			normalizeDatasetId(parts?.[1] || '') === normalizedDatasetName &&
			parts?.[2] === 'PARAMCD'
		);
	});

	if (paramcdItemDef?.CodeListOID) {
		console.log(`Found PARAMCD CodeList: ${paramcdItemDef.CodeListOID}`);
		const codeList = define.CodeLists.find((cl) => cl.OID === paramcdItemDef.CodeListOID);
		if (codeList?.CodeListItems) {
			codeList.CodeListItems.forEach((item) => {
				if (item.CodedValue && item.Decode?.TranslatedText) {
					paramcdToParamMap.set(item.CodedValue, item.Decode.TranslatedText);
				}
			});
			console.log(`Found ${paramcdToParamMap.size} parameter mappings from CodeList`);
		}
	}

	// Strategy 2: Find parameters from WhereClause references to PARAMCD
	if (paramcdToParamMap.size === 0) {
		console.log('No CodeList found, searching WhereClauseDefs for PARAMCD references');
		define.WhereClauseDefs.forEach((whereClause) => {
			whereClause.RangeChecks.forEach((check) => {
				const parts = check.ItemOID.split('.');
				if (
					parts.length === 3 &&
					normalizeDatasetId(parts[1]) === normalizedDatasetName &&
					parts[2] === 'PARAMCD' &&
					(check.Comparator === 'EQ' || check.Comparator === 'IN')
				) {
					check.CheckValues.forEach((value) => {
						if (!paramcdToParamMap.has(value)) {
							// Try to find a corresponding PARAM value
							const paramValue = findParamValueForParamcd(define, normalizedDatasetName, value);
							paramcdToParamMap.set(value, paramValue || value);
						}
					});
				}
			});
		});
		console.log(`Found ${paramcdToParamMap.size} parameter mappings from WhereClauseDefs`);
	}

	// Log the results
	console.log('PARAMCD to PARAM mapping:');
	if (paramcdToParamMap.size > 0) {
		console.table(
			Array.from(paramcdToParamMap.entries()).map(([paramcd, param]) => ({
				PARAMCD: paramcd,
				PARAM: param
			}))
		);
	} else {
		console.log('No PARAMCD to PARAM mappings found');
	}

	return paramcdToParamMap;
}

/**
 * Helper to find a PARAM value for a given PARAMCD by searching the define
 */
function findParamValueForParamcd(
	define: ParsedDefineXML,
	datasetName: string,
	paramcd: string
): string | null {
	// Look for an ItemDef for PARAM that might contain this information
	// This could be expanded for more sophisticated parameter finding logic

	// For now, just using the PARAMCD as the PARAM value if we can't find a better mapping
	return paramcd;
}
