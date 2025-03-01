// vlm-processor.ts - Main module for processing Value-Level Metadata

import type { ParsedDefineXML } from '$lib/types/define-xml';
import type { ProcessedVLM } from '$lib/types/VLMtypes';
import { buildParamcdMapping } from './paramcd-mapper';
import { findValueListDefs } from './value-list-finder';
import { processParameterItemRefs } from './item-ref-processor';
import { validateVLMStructure } from './vlm-validator';
import { generateTableStructure, createVLMSummary } from './vlm-visualizer';

/**
 * Main function to process Value-Level Metadata for a dataset
 * @param define The parsed Define-XML document
 * @param datasetName The name of the dataset to process
 * @returns Processed VLM structure
 */
export function processValueLevelMetadata(
	define: ParsedDefineXML,
	datasetName: string
): ProcessedVLM {
	console.log('==== STEP 1: INITIALIZE VLM PROCESSING ====');
	console.log('Starting enhanced VLM processing for dataset:', datasetName);
	console.log('Define-XML structure keys:', Object.keys(define));
	console.log('ItemDefs count:', define.ItemDefs?.length);
	console.log('ValueListDefs count:', define.ValueListDefs?.length);
	console.log('WhereClauseDefs count:', define.WhereClauseDefs?.length);

	const result: ProcessedVLM = {
		dataset: datasetName,
		variables: new Map()
	};

	// ==== STEP 2: IDENTIFY PARAMETERS REQUIRING VALUE-LEVEL METADATA ====
	console.log('==== STEP 2: IDENTIFY PARAMETERS REQUIRING VALUE-LEVEL METADATA ====');

	// 2a. Build PARAMCD to PARAM mapping (for parameter decoding)
	const paramcdToParamMap = buildParamcdMapping(define, datasetName);

	// 2b. Find all variables that have ValueListDefs
	const valueListDefs = findValueListDefs(define, datasetName);

	// ==== STEP 3: PROCESS VALUE LIST DEFINITIONS FOR EACH VARIABLE ====
	console.log('==== STEP 3: PROCESS VALUE LIST DEFINITIONS FOR EACH VARIABLE ====');

	const processedVariables = new Set<string>();

	valueListDefs.forEach((valueListDef, index) => {
		if (!valueListDef.OID) return;

		const parts = valueListDef.OID.split('.');
		if (parts.length < 3) {
			console.warn(`Invalid ValueListDef OID format: ${valueListDef.OID}`);
			return;
		}

		const variable = parts[2];
		console.log(`Processing variable [${index + 1}/${valueListDefs.length}]: ${variable}`);
		processedVariables.add(variable);

		// Create or get the variable entry in our result
		let vlmVariable = result.variables.get(variable);
		if (!vlmVariable) {
			vlmVariable = {
				name: variable,
				valueListDef: {
					OID: valueListDef.OID,
					description: valueListDef.Description || undefined,
					ItemRefs: []
				}
			};
			result.variables.set(variable, vlmVariable);
		}

		// ==== STEP 4: PROCESS WHERE CLAUSES AND ITEMREFS ====
		console.log(`  - Processing ItemRefs for ${variable}`);
		if (valueListDef.ItemRefs && valueListDef.ItemRefs.length > 0) {
			// Process all parameter-specific ItemRefs in this ValueListDef
			const itemRefs = processParameterItemRefs(
				valueListDef,
				define,
				paramcdToParamMap,
				datasetName
			);

			// Log the processed ItemRefs for this variable
			console.log(`  - Found ${itemRefs.length} parameter-specific definitions for ${variable}`);
			if (itemRefs.length > 0) {
				console.log(`  - Sample of parameter-specific definitions for ${variable}:`);
				const sampleSize = Math.min(3, itemRefs.length);
				itemRefs.slice(0, sampleSize).forEach((ref, i) => {
					console.log(
						`    [${i + 1}] PARAMCD: ${ref.paramcd}, Description: ${ref.itemDescription || 'N/A'}`
					);
				});
			}

			vlmVariable.valueListDef.ItemRefs.push(...itemRefs);
		} else {
			console.log(`  - No ItemRefs found in ValueListDef ${valueListDef.OID}`);
		}
	});

	// ==== STEP 5: ENSURE PARAM VARIABLE EXISTS ====
	console.log('==== STEP 5: ENSURE PARAM VARIABLE EXISTS ====');

	// Add PARAM variable entry if it doesn't exist
	// This ensures we have a proper mapping from PARAMCD to PARAM display values
	if (paramcdToParamMap.size > 0 && !result.variables.has('PARAM')) {
		console.log('Creating synthetic PARAM variable from PARAMCD mapping');

		const paramItemRefs = Array.from(paramcdToParamMap.entries()).map(
			([paramcd, param], index) => ({
				paramcd,
				paramInfo: {
					ordinal: index + 1,
					codedValue: paramcd,
					decode: param,
					isExternal: false
				},
				mandatory: true,
				orderNumber: index + 1
			})
		);

		result.variables.set('PARAM', {
			name: 'PARAM',
			valueListDef: {
				OID: `VL.${datasetName}.PARAM`,
				ItemRefs: paramItemRefs
			}
		});

		console.log(`Added PARAM variable with ${paramItemRefs.length} parameters`);
	} else if (result.variables.has('PARAM')) {
		console.log('PARAM variable already exists in the result');
	} else {
		console.log('No PARAM variable created (no parameters found)');
	}

	// ==== STEP 6: ENSURE PARAMCD VARIABLE EXISTS ====
	console.log('==== STEP 6: ENSURE PARAMCD VARIABLE EXISTS ====');

	// Add PARAMCD variable if needed
	if (paramcdToParamMap.size > 0 && !result.variables.has('PARAMCD')) {
		console.log('Creating synthetic PARAMCD variable');

		const paramcdItemRefs = Array.from(paramcdToParamMap.keys()).map((paramcd, index) => ({
			paramcd,
			paramInfo: {
				ordinal: index + 1,
				codedValue: paramcd,
				decode: paramcd, // For PARAMCD, the decode is the same as the code
				isExternal: false
			},
			mandatory: true,
			orderNumber: index + 1
		}));

		result.variables.set('PARAMCD', {
			name: 'PARAMCD',
			valueListDef: {
				OID: `VL.${datasetName}.PARAMCD`,
				ItemRefs: paramcdItemRefs
			}
		});

		console.log(`Added PARAMCD variable with ${paramcdItemRefs.length} parameter codes`);
	} else if (result.variables.has('PARAMCD')) {
		console.log('PARAMCD variable already exists in the result');
	} else {
		console.log('No PARAMCD variable created (no parameters found)');
	}

	// ==== STEP 7: GENERATE TABLE STRUCTURE ====
	generateTableStructure(result);

	// ==== STEP 8: VALIDATE AND RETURN RESULT ====
	console.log('==== STEP 8: VALIDATE AND RETURN RESULT ====');

	// Log the final result summary
	const summary = createVLMSummary(result);
	console.log('Final enhanced VLM structure:', summary);

	// Validation
	validateVLMStructure(result);

	return result;
}
