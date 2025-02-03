<script lang="ts">
	import type { ParsedDefineXML } from '$lib/core/processors/defineXML/types';
	import { processValueLevelMetadata } from '$lib/core/processors/defineXML/VLMProcessingLogic';
	import DataTable from '$lib/components/data/DataTable/DataTable.svelte';
	import { tableUIStore } from '$lib/core/stores/tableUIStore.svelte';
	import { normalizeDatasetId } from '$lib/core/utils/datasetUtils';
	import { untrack } from 'svelte';

	let { sdtmDefine, adamDefine, datasetName } = $props<{
		sdtmDefine: ParsedDefineXML | null;
		adamDefine: ParsedDefineXML | null;
		datasetName: string;
	}>();

	// Derived values
	let activeDefine = $derived(sdtmDefine || adamDefine);
	let cleanDatasetName = $derived(datasetName ? normalizeDatasetId(datasetName) : '');

	// Processing state
	let processingError = $state<string | null>(null);
	let processedVLM = $state<ReturnType<typeof processValueLevelMetadata> | null>(null);
	let tableData = $state<Array<Record<string, any>>>([]);

	function formatVLMCell(data: any) {
		if (!data) return '';

		const parts = [];

		// Add where clause info
		if (data.whereClause) {
			const { comparator, checkValues } = data.whereClause;
			parts.push(`Where: ${checkValues.join(', ')} (${comparator})`);
		}

		// Add method info if available
		if (data.method?.description) {
			parts.push(`Method: ${data.method.description}`);
		}

		// Add mandatory status
		if (data.mandatory) {
			parts.push('Required');
		}

		return parts.join('\n');
	}

	// Process VLM data when inputs change
	$effect(() => {
		if (!activeDefine || !cleanDatasetName) {
			processedVLM = null;
			processingError = null;
			tableData = [];
			return;
		}

		try {
			const result = untrack(() => processValueLevelMetadata(activeDefine, cleanDatasetName));

			if (result.variables.size > 0) {
				// Get unique PARAMCDs
				const paramcds = new Set<string>();
				result.variables.forEach((variable) => {
					variable.valueListDef.itemRefs.forEach((itemRef) => {
						if (itemRef.paramcd) paramcds.add(itemRef.paramcd);
					});
				});

				// Create table rows with formatted cells
				tableData = Array.from(paramcds).map((paramcd) => {
					const row: Record<string, any> = {
						PARAMCD: paramcd,
						_raw: {} // Store raw data for potential use
					};

					result.variables.forEach((variable, varName) => {
						const itemRef = variable.valueListDef.itemRefs.find((ref) => ref.paramcd === paramcd);

						// Store raw data
						row._raw[varName] = itemRef
							? {
									whereClause: itemRef.whereClause,
									method: itemRef.method,
									mandatory: itemRef.mandatory
								}
							: null;

						// Store formatted display
						row[varName] = itemRef
							? formatVLMCell({
									whereClause: itemRef.whereClause,
									method: itemRef.method,
									mandatory: itemRef.mandatory
								})
							: '';
					});
					return row;
				});

				// Initialize table UI
				const columns = ['PARAMCD', ...Array.from(result.variables.keys())];
				untrack(() => tableUIStore.initialize(columns));
			} else {
				tableData = [];
			}

			processedVLM = result;
			processingError = null;
		} catch (error) {
			console.error('Error processing VLM:', error);
			processedVLM = null;
			processingError =
				error instanceof Error ? error.message : 'Unknown error processing VLM data';
			tableData = [];
		}
	});
</script>

<div class="flex h-full">
	<div class="min-w-0 flex-1">
		{#if processingError}
			<div class="flex h-[200px] items-center justify-center text-destructive">
				<p>Error: {processingError}</p>
			</div>
		{:else if tableData.length}
			<DataTable data={tableData} />
		{:else}
			<div class="flex h-[200px] items-center justify-center text-muted-foreground">
				<p>No value level metadata available for this dataset</p>
			</div>
		{/if}
	</div>
</div>
