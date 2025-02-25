<script lang="ts" module>
	import type { ParsedDefineXML } from '$lib/types/define-xml';
	import type { ProcessedVLM } from '$lib/core/processors/defineXML/VLMProcessingLogic';
	import { processValueLevelMetadata } from '$lib/core/processors/defineXML/VLMProcessingLogic';
	import {
		materializeVLM,
		type MaterializedVLMResult
	} from '$lib/core/processors/defineXML/MaterializedVLM';

	export function createVLMProcessor() {
		// Use let instead of const for mutable state
		let vlmData = $state<ProcessedVLM>({
			dataset: '',
			variables: new Map()
		});

		let materializedData = $state<MaterializedVLMResult | null>(null);
		let status = $state<'idle' | 'processing' | 'error' | 'complete'>('idle');
		let errorMessage = $state<string | null>(null);

		function process(define: ParsedDefineXML | null, datasetName: string) {
			if (!define || !datasetName) {
				status = 'idle';
				errorMessage = null;
				materializedData = null;
				return;
			}

			try {
				status = 'processing';
				errorMessage = null;
				console.log('Processing VLM for:', {
					datasetName,
					valueListDefs: define.ValueListDefs?.length,
					whereClauses: define.WhereClauseDefs?.length
				});

				// First, process the basic VLM data
				const result = processValueLevelMetadata(define, datasetName);
				console.log('VLM Processing Result:', {
					dataset: result.dataset,
					variableCount: result.variables.size,
					variables: Array.from(result.variables.entries())
				});

				// Set vlmData with the processed VLM
				vlmData = result;

				// Then, materialize it into a full dataset representation
				try {
					const mResult = materializeVLM(define, datasetName, result);
					materializedData = mResult;
					console.log('Materialized VLM result:', {
						dataset: mResult.dataset,
						columns: mResult.columns,
						rowCount: mResult.rows.length,
						duplicateSources: mResult.duplicateSources
					});
				} catch (materializeErr) {
					console.error('Error materializing VLM:', materializeErr);
					errorMessage =
						materializeErr instanceof Error
							? materializeErr.message
							: 'Error materializing VLM data';
					status = 'error';
					return;
				}

				status = 'complete';
			} catch (err) {
				console.error('VLM Processing Error:', err);
				errorMessage = err instanceof Error ? err.message : 'Unknown error';
				status = 'error';
				materializedData = null;
			}
		}

		return {
			process,
			vlmData: () => vlmData,
			materializedData: () => materializedData,
			status: () => status,
			error: () => errorMessage
		};
	}
</script>
