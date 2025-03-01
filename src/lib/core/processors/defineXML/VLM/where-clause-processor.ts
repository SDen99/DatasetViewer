// where-clause-processor.ts - Module to process WhereClauseDefs

import type { WhereClauseDef, RangeCheck, ParsedDefineXML } from '$lib/types/define-xml';
import type { WhereClauseResult } from '$lib/types/VLMtypes';
import { normalizeDatasetId } from '$lib/core/utils/datasetUtils';

/**
 * Processes a WhereClause to extract parameter values and conditions
 * @param whereClauseOID The OID of the WhereClauseDef to process
 * @param whereClauseDefs Array of all WhereClauseDefs
 * @param datasetName The name of the dataset
 * @returns A WhereClauseResult containing parameters and conditions
 */
export function processWhereClause(
	whereClauseOID: string,
	whereClauseDefs: WhereClauseDef[],
	datasetName: string
): WhereClauseResult | null {
	console.log(`Processing WhereClause: ${whereClauseOID}`);

	// Find the matching WhereClauseDef
	const whereClause = whereClauseDefs.find((def) => def.OID === whereClauseOID);
	if (!whereClause) {
		console.warn(`No WhereClauseDef found for OID: ${whereClauseOID}`);
		return null;
	}

	// Initialize result
	const result: WhereClauseResult = {
		paramcds: [],
		conditions: [],
		stratificationVariables: new Map(),
		specialVariables: {}
	};

	if (!whereClause.RangeChecks || whereClause.RangeChecks.length === 0) {
		console.log(`No RangeChecks found in WhereClause ${whereClauseOID}`);
		return result;
	}

	// Process all RangeChecks
	whereClause.RangeChecks.forEach((check, idx) => {
		// Extract dataset and variable from ItemOID
		const itemParts = check.ItemOID.split('.');
		if (itemParts.length !== 3) {
			console.warn(`Invalid ItemOID format: ${check.ItemOID}`);
			return;
		}

		const [prefix, checkDataset, variable] = itemParts;

		// Validate dataset
		const normalizedCheckDataset = normalizeDatasetId(checkDataset);
		const normalizedTargetDataset = normalizeDatasetId(datasetName);

		if (normalizedCheckDataset !== normalizedTargetDataset) {
			console.warn(
				`Dataset mismatch: expected ${normalizedTargetDataset}, got ${normalizedCheckDataset}`
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

		// Handle special variables based on their role
		if (variable === 'PARAMCD') {
			// PARAMCD is our primary parameter identifier
			if (check.Comparator === 'EQ' || check.Comparator === 'IN') {
				result.paramcds.push(...check.CheckValues);
			}
		} else if (['DTYPE', 'PARCAT', 'PARCAT1', 'PARCAT2'].includes(variable)) {
			// These are stratification variables
			result.stratificationVariables.set(variable, {
				comparator: check.Comparator,
				values: check.CheckValues
			});
		} else {
			// Other variables are still tracked as special variables
			result.specialVariables[variable] = check.CheckValues.join(',');
		}
	});

	return result;
}

/**
 * Checks WhereClauseDefs for circular references
 * @param define The parsed Define-XML document
 * @returns True if no circular references are found
 */
export function validateNoCircularReferences(define: ParsedDefineXML): boolean {
	// Implementation would check for circular references in WhereClauseDefs
	// For example, if WhereClause A references variable X which has WhereClause B,
	// and WhereClause B references variable Y which has WhereClause A

	// This would require a graph traversal algorithm

	return true; // Placeholder implementation
}
