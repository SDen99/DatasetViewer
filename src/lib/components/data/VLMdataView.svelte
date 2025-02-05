<script lang="ts">
	import {
		processValueLevelMetadata,
		type ProcessedVLM,
		type VLMVariable,
		type VLMItemRef
	} from '$lib/core/processors/defineXML/VLMProcessingLogic';
	import ExpandableCell from './ExpandableCell.svelte';
	import { Alert, AlertDescription } from '$lib/components/core/alert';
	import type { ParsedDefineXML } from '$lib/core/processors/defineXML/types';
	import { normalizeDatasetId } from '$lib/core/utils/datasetUtils';

	let { sdtmDefine, adamDefine, datasetName } = $props<{
		sdtmDefine: ParsedDefineXML | null;
		adamDefine: ParsedDefineXML | null;
		datasetName: string;
	}>();

	let activeDefine = $derived(sdtmDefine || adamDefine);
	let cleanDatasetName = $derived(datasetName ? normalizeDatasetId(datasetName) : '');
	let processingError = $state<string | null>(null);
	let columns = $state<string[]>(['PARAMCD']);
	let rows = $state<any[]>([]);

	function transformVLMData(vlm: ProcessedVLM) {
		const allRows: any[] = [];
		const allColumns = new Set(['PARAMCD']);

		// First pass: collect all variables
		vlm.variables.forEach((variable, variableName) => {
			allColumns.add(variableName);
		});

		// Second pass: create rows
		vlm.variables.forEach((variable, variableName) => {
			variable.valueListDef.itemRefs.forEach((itemRef) => {
				// Find or create row
				let row = allRows.find((r) => r.paramcd === itemRef.paramcd);
				if (!row) {
					row = { paramcd: itemRef.paramcd };
					allRows.push(row);
				}

				// Add content
				let content = '';
				if (itemRef.method?.description) {
					content += itemRef.method.description;
				}
				if (itemRef.whereClause) {
					content += (content ? '\n' : '') + `Where: ${itemRef.whereClause.checkValues.join(', ')}`;
				}

				row[variableName] = content;
			});
		});

		// Update state
		columns = Array.from(allColumns);
		rows = allRows;
	}

	// Main processing effect
	$effect(() => {
		if (!activeDefine || !cleanDatasetName) {
			processingError = null;
			columns = ['PARAMCD'];
			rows = [];
			return;
		}

		try {
			console.log('Processing with:', { activeDefine, cleanDatasetName });
			const result = processValueLevelMetadata(activeDefine, cleanDatasetName);
			console.log('Processing result:', result);
			transformVLMData(result);
			processingError = null;
		} catch (error) {
			console.error('Processing error:', error);
			columns = ['PARAMCD'];
			rows = [];
			processingError =
				error instanceof Error ? error.message : 'Unknown error processing VLM data';
		}
	});
</script>

<div class="w-full space-y-6">
	{#if processingError}
		<Alert variant="destructive">
			<AlertDescription>
				Error processing value level metadata: {processingError}
			</AlertDescription>
		</Alert>
	{:else if rows.length > 0}
		<div class="rounded-lg border bg-card">
			<div class="overflow-x-auto">
				<table class="w-full border-collapse border">
					<thead>
						<tr class="bg-muted">
							{#each columns as column}
								<th class="whitespace-nowrap border p-2 text-left font-semibold">
									{column}
								</th>
							{/each}
						</tr>
					</thead>
					<tbody>
						{#each rows as row}
							<tr class="hover:bg-muted/50">
								{#each columns as column}
									<td class="border p-2">
										{#if column === 'PARAMCD'}
											{row[column]}
										{:else if row[column]}
											<ExpandableCell content={row[column]} />
										{/if}
									</td>
								{/each}
							</tr>
						{/each}
					</tbody>
				</table>
			</div>
		</div>
	{:else}
		<div class="rounded-lg border p-4 text-center text-muted-foreground">
			No value level metadata available for this dataset
		</div>
	{/if}
</div>
