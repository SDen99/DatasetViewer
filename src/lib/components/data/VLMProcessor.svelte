<script lang="ts" module>
	import type { ParsedDefineXML } from '$lib/types/define-xml';
	import type { ProcessedVLM } from '$lib/core/processors/defineXML/VLMProcessingLogic';
	import { processValueLevelMetadata } from '$lib/core/processors/defineXML/VLMProcessingLogic';
	import { normalizeDatasetId } from '$lib/core/utils/datasetUtils';

	export function createVLMProcessor() {
		let vlmData = $state<ProcessedVLM>({
			dataset: '',
			variables: new Map()
		});

		let status = $state<'idle' | 'processing' | 'error' | 'complete'>('idle');
		let error = $state<string | null>(null);

		function process(define: ParsedDefineXML | null, datasetName: string) {
			if (!define || !datasetName) {
				status = 'idle';
				error = null;
				return;
			}

			try {
				status = 'processing';
				error = null;
				console.log('Processing VLM for:', {
					datasetName,
					valueListDefs: define.ValueListDefs?.length,
					whereClauses: define.WhereClauseDefs?.length
				});

				const result = processValueLevelMetadata(define, datasetName);
				console.log('VLM Processing Result:', {
					dataset: result.dataset,
					variableCount: result.variables.size,
					variables: Array.from(result.variables.entries())
				});

				vlmData = result;
				status = 'complete';
			} catch (err) {
				console.error('VLM Processing Error:', err);
				error = err instanceof Error ? err.message : 'Unknown error';
				status = 'error';
			}
		}

		return {
			process,
			vlmData: () => vlmData,
			status: () => status,
			error: () => error
		};
	}

	// Add this to VLMProcessor.svelte

	// Diagnostic function to examine all variables in the define XML
	function debugDefineStructure(define: ParsedDefineXML, datasetName: string) {
		const normalizedDatasetName = normalizeDatasetId(datasetName);

		console.log('=== DEBUGGING DEFINE STRUCTURE ===');

		// 1. Log all ItemDefs for this dataset
		const datasetItems = define.ItemDefs.filter((item) => {
			const parts = item.OID?.split('.');
			return parts?.[0] === 'IT' && normalizeDatasetId(parts?.[1] || '') === normalizedDatasetName;
		});

		console.log(`Found ${datasetItems.length} ItemDefs for dataset ${datasetName}:`);
		console.log(
			datasetItems.map((item) => {
				const parts = item.OID?.split('.');
				return {
					variable: parts?.[2],
					OID: item.OID,
					hasCodeList: !!item.CodeListOID,
					description: item.Description
				};
			})
		);

		// 2. Log all ValueListDefs
		const valueListDefs = define.ValueListDefs.filter((vl) => {
			const parts = vl.OID?.split('.');
			return parts?.[0] === 'VL' && normalizeDatasetId(parts?.[1] || '') === normalizedDatasetName;
		});

		console.log(`Found ${valueListDefs.length} ValueListDefs for dataset ${datasetName}:`);
		console.log(
			valueListDefs.map((vl) => {
				const parts = vl.OID?.split('.');
				return {
					variable: parts?.[2],
					OID: vl.OID,
					itemRefCount: vl.ItemRefs?.length || 0
				};
			})
		);

		// 3. Log all WhereClauseDefs
		const relevantWhereClauses = define.WhereClauseDefs.filter((wc) =>
			wc.RangeChecks.some((check) => {
				const parts = check.ItemOID.split('.');
				return parts[0] === 'IT' && normalizeDatasetId(parts[1]) === normalizedDatasetName;
			})
		);

		console.log(`Found ${relevantWhereClauses.length} WhereClauseDefs for dataset ${datasetName}:`);
		console.log(
			relevantWhereClauses.map((wc) => {
				return {
					OID: wc.OID,
					rangeChecks: wc.RangeChecks.map((check) => {
						const parts = check.ItemOID.split('.');
						return {
							variable: parts[2],
							comparator: check.Comparator,
							values: check.CheckValues
						};
					})
				};
			})
		);

		// 4. Analyze specific variables of interest
		const variablesOfInterest = ['ABLFL', 'APHASE', 'AVISIT', 'BASE', 'CHG', 'DTYPE'];

		variablesOfInterest.forEach((variable) => {
			console.log(`=== Analysis for ${variable} ===`);

			// Check if ItemDef exists
			const itemDef = datasetItems.find((item) => {
				const parts = item.OID?.split('.');
				return parts?.[2] === variable;
			});

			console.log(`ItemDef exists: ${!!itemDef}`);
			if (itemDef) {
				console.log(`ItemDef details:`, {
					OID: itemDef.OID,
					Name: itemDef.Name,
					DataType: itemDef.DataType,
					CodeList: itemDef.CodeListOID
				});
			}

			// Check if ValueListDef exists
			const valueListDef = valueListDefs.find((vl) => {
				const parts = vl.OID?.split('.');
				return parts?.[2] === variable;
			});

			console.log(`ValueListDef exists: ${!!valueListDef}`);
			if (valueListDef) {
				console.log(`ValueListDef details:`, {
					OID: valueListDef.OID,
					ItemRefCount: valueListDef.ItemRefs?.length || 0
				});
			}

			// Check if variable is referenced in any WhereClause
			const referencingWhereClauses = relevantWhereClauses.filter((wc) =>
				wc.RangeChecks.some((check) => {
					const parts = check.ItemOID.split('.');
					return parts[2] === variable;
				})
			);

			console.log(`Referenced in ${referencingWhereClauses.length} WhereClauseDefs`);
			if (referencingWhereClauses.length > 0) {
				console.log(
					`WhereClause references:`,
					referencingWhereClauses.map((wc) => wc.OID)
				);
			}

			// Check if other WhereClauseDefs mention this variable in their values
			const mentioningWhereClauses = relevantWhereClauses.filter((wc) =>
				wc.RangeChecks.some((check) =>
					check.CheckValues.some((value) => value === variable || value.includes(variable))
				)
			);

			console.log(`Mentioned in ${mentioningWhereClauses.length} WhereClauseDefs`);
			if (mentioningWhereClauses.length > 0) {
				console.log(
					`Mentioning WhereClauseDefs:`,
					mentioningWhereClauses.map((wc) => wc.OID)
				);
			}
		});

		console.log('=== END DEBUGGING ===');
	}
</script>
