<script lang="ts" module>
	import type { ParsedDefineXML } from '$lib/types/define-xml';
	import type { ProcessedVLM } from '$lib/core/processors/defineXML/VLMProcessingLogic';
	import { processValueLevelMetadata } from '$lib/core/processors/defineXML/VLMProcessingLogic';

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
</script>
