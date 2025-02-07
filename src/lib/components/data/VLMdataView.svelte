<script lang="ts">
	import { formatCellContent } from './cellFormatting';
	import ExpandableCell from './ExpandableCell.svelte';
	import { Alert, AlertDescription } from '$lib/components/core/alert';
	import type { ParsedDefineXML } from '$lib/core/processors/defineXML/types';
	import { normalizeDatasetId } from '$lib/core/utils/datasetUtils';
	import { processValueLevelMetadata } from '$lib/core/processors/defineXML/VLMProcessingLogic';

	let { sdtmDefine, adamDefine, datasetName } = $props<{
		sdtmDefine: ParsedDefineXML | null;
		adamDefine: ParsedDefineXML | null;
		datasetName: string;
	}>();

	let activeDefine = $state<ParsedDefineXML | null>(null);
	let cleanDatasetName = $state('');
	let processingError = $state<string | null>(null);
	let displayData = $state<{
		hasData: boolean;
		columns?: string[];
		rows?: any[];
	}>({ hasData: false });

	// Effect to set active define
	$effect(() => {
		console.log('VLM View - Props received:', {
			hasSDTM: !!sdtmDefine,
			hasADaM: !!adamDefine,
			datasetName
		});
		activeDefine = sdtmDefine || adamDefine;
		cleanDatasetName = datasetName ? normalizeDatasetId(datasetName) : '';
	});

	// Effect to process data
	$effect(() => {
		console.log('VLM View - Processing:', {
			hasActiveDefine: !!activeDefine,
			cleanDatasetName
		});

		if (!activeDefine || !cleanDatasetName) {
			displayData = { hasData: false };
			return;
		}

		try {
			const vlmData = processValueLevelMetadata(activeDefine, cleanDatasetName);

			if (!vlmData?.variables || vlmData.variables.size === 0) {
				displayData = { hasData: false };
				return;
			}

			const columns = new Set(['PARAMCD', 'PARAM']); // Ensure PARAM is included
			const rows: any[] = [];

			vlmData.variables.forEach((variable, variableName) => {
				if (!['PARAMCD', 'PARAM'].includes(variableName)) {
					columns.add(variableName);
				}

				variable.valueListDef.itemRefs.forEach((itemRef) => {
					let row = rows.find((r) => r.PARAMCD === itemRef.paramcd);
					if (!row) {
						row = {
							PARAMCD: itemRef.paramcd,
							PARAM: itemRef.paramInfo?.decode || ''
						};
						rows.push(row);
					}
					if (variableName !== 'PARAMCD' && variableName !== 'PARAM') {
						row[variableName] = itemRef;
					}
				});
			});

			// Sort rows by codelist ordinal if available
			rows.sort((a, b) => {
				const aRef = vlmData.variables
					.get('PARAMCD')
					?.valueListDef.itemRefs.find((ref) => ref.paramcd === a.PARAMCD);
				const bRef = vlmData.variables
					.get('PARAMCD')
					?.valueListDef.itemRefs.find((ref) => ref.paramcd === b.PARAMCD);

				return (aRef?.paramInfo?.ordinal || 0) - (bRef?.paramInfo?.ordinal || 0);
			});

			displayData = {
				hasData: true,
				columns: Array.from(columns),
				rows
			};
		} catch (error) {
			console.error('VLM View - Error:', error);
			processingError = error instanceof Error ? error.message : 'Unknown error';
			displayData = { hasData: false };
		}
	});
</script>

<!-- Debug info -->
<div class="mb-2 p-2 text-sm text-muted-foreground">
	Active Define: {!!activeDefine}, Dataset: {cleanDatasetName}
</div>

<!-- Main content -->
<div class="w-full space-y-6">
	{#if processingError}
		<Alert variant="destructive">
			<AlertDescription>
				Error processing value level metadata: {processingError}
			</AlertDescription>
		</Alert>
	{:else if displayData.hasData && displayData.columns && displayData.rows}
		<div class="rounded-lg border bg-card">
			<div class="overflow-x-auto">
				<table class="w-full border-collapse border">
					<thead>
						<tr>
							{#each displayData.columns as column}
								<th class="whitespace-nowrap border p-2 text-left font-semibold">
									{column}
								</th>
							{/each}
						</tr>
					</thead>
					<tbody>
						{#each displayData.rows as row}
							<tr class="hover:bg-muted/50">
								{#each displayData.columns as column}
									<td class="border p-2">
										{#if column === 'PARAMCD' || column === 'PARAM'}
											{row[column]}
										{:else if row[column]}
											<ExpandableCell content={formatCellContent(row[column], column)} />
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
