// vlm-validator.ts - Module to validate VLM structure

import type { ProcessedVLM } from '$lib/types/VLMtypes';

/**
 * Validates the VLM structure for completeness and correctness
 * @param vlm The processed VLM structure
 * @returns Number of validation warnings
 */
export function validateVLMStructure(vlm: ProcessedVLM): number {
	console.log('Starting VLM structure validation...');
	let warnings = 0;

	// Check for required variables
	const hasParamcd = vlm.variables.has('PARAMCD');
	const hasParam = vlm.variables.has('PARAM');

	if (!hasParamcd) {
		console.warn('Validation Warning: PARAMCD variable is missing in VLM');
		warnings++;
	}

	if (!hasParam) {
		console.warn('Validation Warning: PARAM variable is missing in VLM');
		warnings++;
	}

	// Check that all variables have ItemRefs
	vlm.variables.forEach((variable, name) => {
		if (variable.valueListDef.ItemRefs.length === 0) {
			console.warn(`Validation Warning: Variable ${name} has no ItemRefs`);
			warnings++;
		}
	});

	// Check for variables with missing definitions
	const paramcdVariable = vlm.variables.get('PARAMCD');
	if (paramcdVariable) {
		const allParamcds = new Set(
			paramcdVariable.valueListDef.ItemRefs.map((item) => item.paramcd).filter(
				(paramcd) => paramcd !== '*'
			)
		);

		vlm.variables.forEach((variable, name) => {
			if (name !== 'PARAMCD' && name !== 'PARAM') {
				const coveredParamcds = new Set(
					variable.valueListDef.ItemRefs.map((item) => item.paramcd).filter(
						(paramcd) => paramcd !== '*'
					)
				);

				const missingParams = Array.from(allParamcds).filter(
					(paramcd) => !coveredParamcds.has(paramcd)
				);

				if (missingParams.length > 0) {
					console.warn(
						`Validation Warning: Variable ${name} is missing definitions for ${missingParams.length} parameters`
					);
					if (missingParams.length <= 5) {
						console.warn(`  Missing parameters: ${missingParams.join(', ')}`);
					} else {
						console.warn(
							`  First 5 missing parameters: ${missingParams.slice(0, 5).join(', ')}...`
						);
					}
					warnings++;
				}
			}
		});
	}

	// Check for duplicate parameter definitions
	vlm.variables.forEach((variable, name) => {
		const paramcdCounts: Record<string, number> = {};
		variable.valueListDef.ItemRefs.forEach((item) => {
			if (item.paramcd !== '*') {
				paramcdCounts[item.paramcd] = (paramcdCounts[item.paramcd] || 0) + 1;
			}
		});

		const duplicates = Object.entries(paramcdCounts)
			.filter(([_, count]) => count > 1)
			.map(([paramcd]) => paramcd);

		if (duplicates.length > 0) {
			console.warn(
				`Validation Warning: Variable ${name} has duplicate definitions for parameters: ${duplicates.join(', ')}`
			);
			warnings++;
		}
	});

	// Check for method references without corresponding method definitions
	vlm.variables.forEach((variable, name) => {
		variable.valueListDef.ItemRefs.forEach((item) => {
			if (item.methodOID && !item.method) {
				console.warn(
					`Validation Warning: ItemRef for ${name} (PARAMCD=${item.paramcd}) references methodOID ${item.methodOID} but no method definition was found`
				);
				warnings++;
			}
		});
	});

	// Check for empty ItemRef descriptions
	vlm.variables.forEach((variable, name) => {
		const emptyDescriptions = variable.valueListDef.ItemRefs.filter(
			(item) => !item.itemDescription || item.itemDescription.trim() === ''
		).length;

		if (emptyDescriptions > 0) {
			console.warn(
				`Validation Warning: Variable ${name} has ${emptyDescriptions} ItemRefs with empty descriptions`
			);
			warnings++;
		}
	});

	console.log(`VLM Validation completed with ${warnings} warnings`);
	return warnings;
}
