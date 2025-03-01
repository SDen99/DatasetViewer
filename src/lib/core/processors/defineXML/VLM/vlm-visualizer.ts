// vlm-visualizer.ts - Module to create a visualization of the VLM structure

import type { ProcessedVLM } from '$lib/types/VLMtypes';

/**
 * Generates a table structure preview from the processed VLM
 * @param vlm The processed VLM structure
 */
export function generateTableStructure(vlm: ProcessedVLM): void {
	console.log('==== GENERATING TABLE STRUCTURE PREVIEW ====');

	// 1. Collect all columns (variables) that will be in the table
	const allVariables = Array.from(vlm.variables.keys());
	console.log(`Table will have ${allVariables.length} columns:`, allVariables);

	// 2. Collect all unique PARAMCDs for rows
	const allParamcds = new Set<string>();
	const paramcdVariable = vlm.variables.get('PARAMCD');

	if (paramcdVariable && paramcdVariable.valueListDef.ItemRefs.length > 0) {
		paramcdVariable.valueListDef.ItemRefs.forEach((item) => {
			if (item.paramcd !== '*') {
				allParamcds.add(item.paramcd);
			}
		});
	}

	// 3. Create a preview of the table rows
	console.log(`Table will have ${allParamcds.size} parameter rows:`);

	const tableStructure = Array.from(allParamcds).map((paramcd) => {
		const row: Record<string, string> = { PARAMCD: paramcd };

		// Add PARAM column if available
		const paramVariable = vlm.variables.get('PARAM');
		if (paramVariable) {
			const paramRef = paramVariable.valueListDef.ItemRefs.find((item) => item.paramcd === paramcd);
			row.PARAM = paramRef?.paramInfo?.decode || '';
		}

		// Check which other variables have metadata for this PARAMCD
		allVariables.forEach((variable) => {
			if (variable !== 'PARAMCD' && variable !== 'PARAM') {
				const variableData = vlm.variables.get(variable);
				if (variableData) {
					const hasMetadata = variableData.valueListDef.ItemRefs.some(
						(item) => item.paramcd === paramcd
					);
					row[variable] = hasMetadata ? '✓' : '-';
				}
			}
		});

		return row;
	});

	// Add non-parameterized rows if any exist
	const nonParamRows: Record<string, string>[] = [];
	allVariables.forEach((variable) => {
		const variableData = vlm.variables.get(variable);
		if (variableData) {
			const nonParamItems = variableData.valueListDef.ItemRefs.filter(
				(item) => item.isNonParameterized
			);

			if (nonParamItems.length > 0) {
				if (nonParamRows.length === 0) {
					// Create a new non-parameterized row
					const row: Record<string, string> = {
						PARAMCD: '*',
						PARAM: 'Non-Parameter Specific'
					};
					allVariables.forEach((v) => {
						if (v !== 'PARAMCD' && v !== 'PARAM') {
							row[v] = '-';
						}
					});
					nonParamRows.push(row);
				}

				// Mark variables that have non-parameterized items
				nonParamRows[0][variable] = '✓';
			}
		}
	});

	// Print the table structure
	console.log('Table Structure Preview:');
	console.table([...nonParamRows, ...tableStructure.slice(0, 5)]);
	if (tableStructure.length > 5) {
		console.log(`...and ${tableStructure.length - 5} more parameter rows`);
	}

	// 4. Generate some statistics
	const parameterCoverage: Record<string, number> = {};
	allVariables.forEach((variable) => {
		if (variable !== 'PARAMCD' && variable !== 'PARAM') {
			const variableData = vlm.variables.get(variable);
			if (variableData) {
				const coveredParams = variableData.valueListDef.ItemRefs.filter(
					(item) => item.paramcd !== '*'
				).map((item) => item.paramcd);

				parameterCoverage[variable] = (coveredParams.length / allParamcds.size) * 100;
			}
		}
	});

	console.log('Parameter Coverage by Variable:');
	console.table(
		Object.entries(parameterCoverage).map(([variable, coverage]) => ({
			Variable: variable,
			'Coverage %': coverage.toFixed(1) + '%',
			'Covered Parameters': vlm.variables.get(variable)?.valueListDef.ItemRefs.length || 0,
			'Total Parameters': allParamcds.size
		}))
	);
}

/**
 * Creates a summary of the processed VLM
 * @param vlm The processed VLM structure
 * @returns A summary object
 */
export function createVLMSummary(vlm: ProcessedVLM): Record<string, any> {
	const allParamcds = new Set<string>();
	const hasNonParameterized = Array.from(vlm.variables.values()).some((variable) =>
		variable.valueListDef.ItemRefs.some((item) => item.isNonParameterized)
	);

	// Count total parameters
	const paramcdVariable = vlm.variables.get('PARAMCD');
	if (paramcdVariable) {
		paramcdVariable.valueListDef.ItemRefs.forEach((item) => {
			if (item.paramcd !== '*') {
				allParamcds.add(item.paramcd);
			}
		});
	}

	return {
		dataset: vlm.dataset,
		variableCount: vlm.variables.size,
		variables: Array.from(vlm.variables.keys()),
		parameterCount: allParamcds.size,
		hasNonParameterizedData: hasNonParameterized,
		parameters: Array.from(allParamcds).slice(0, 10) // Show first 10 parameters
	};
}
