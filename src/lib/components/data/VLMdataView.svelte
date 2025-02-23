<script lang="ts">
	import DragHandle from '$lib/components/data/DataTable/DragHandle.svelte';
	import ResizeHandle from '$lib/components/data/DataTable/ResizeHandle.svelte';
	import { formatCellContent } from './cellFormatting';
	import ExpandableCell from './ExpandableCell.svelte';
	import { Alert, AlertDescription } from '$lib/components/core/alert';
	import type { ParsedDefineXML } from '$lib/types/define-xml';
	import { normalizeDatasetId } from '$lib/core/utils/datasetUtils';
	import { createVLMProcessor } from './VLMProcessor.svelte';
	import { vlmStore } from '$lib/core/stores/VLMStore.svelte';

	const props = $props<{
		sdtmDefine: ParsedDefineXML | null;
		adamDefine: ParsedDefineXML | null;
		datasetName: string;
	}>();

	const processor = createVLMProcessor();
	let processingError = $state<string | null>(null);

	let activeDefine = $state<ParsedDefineXML | null>(null);
	let cleanDatasetName = $state('');
	let displayData = $state<{
		hasData: boolean;
		columns?: string[];
		rows?: any[];
	}>({ hasData: false });

	let draggedColumn = $state<string | null>(null);
	let dragOverColumn = $state<string | null>(null);
	let columnWidths = $state({});

	// Effect to handle define changes and processing
	$effect(() => {
		activeDefine = props.sdtmDefine || props.adamDefine;
		cleanDatasetName = props.datasetName ? normalizeDatasetId(props.datasetName) : '';

		if (activeDefine && cleanDatasetName) {
			processor.process(activeDefine, cleanDatasetName);
		}
	});

	// Process VLM data into display format
	$effect(() => {
		const vlmData = processor.vlmData();
		const processingStatus = processor.status(); // Changed from processing to status

		if (processingStatus === 'error') {
			// Changed from processingStatus.status
			processingError = processor.error() || 'Unknown error occurred';
			displayData = { hasData: false };
			return;
		}

		if (!vlmData?.variables || vlmData.variables.size === 0) {
			displayData = { hasData: false };
			return;
		}

		try {
			const columns = new Set(['PARAMCD', 'PARAM']);
			const rows = new Map<string, any>();

			// First pass: Collect all PARAMCDs and their PARAM values
			vlmData.variables.forEach((variable, variableName) => {
				if (!['PARAMCD', 'PARAM'].includes(variableName)) {
					columns.add(variableName);
				}

				variable.valueListDef.itemRefs.forEach((itemRef) => {
					if (!rows.has(itemRef.paramcd)) {
						rows.set(itemRef.paramcd, {
							PARAMCD: itemRef.paramcd,
							PARAM: itemRef.paramInfo?.decode || ''
						});
					}
				});
			});

			// Second pass: Add other variable information
			vlmData.variables.forEach((variable, variableName) => {
				if (variableName !== 'PARAMCD' && variableName !== 'PARAM') {
					variable.valueListDef.itemRefs.forEach((itemRef) => {
						const row = rows.get(itemRef.paramcd);
						if (row) {
							row[variableName] = itemRef;
						}
					});
				}
			});

			// Convert rows Map to array and sort
			const sortedRows = Array.from(rows.values()).sort((a, b) => {
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
				rows: sortedRows
			};

			processingError = null;
		} catch (error) {
			console.error('VLM View - Error:', error);
			processingError = error instanceof Error ? error.message : 'Unknown error';
			displayData = { hasData: false };
		}
	});

	function handleResize(column: string, width: number) {
		if (cleanDatasetName) {
			vlmStore.updateColumnWidth(cleanDatasetName, column, width);
		}
	}

	function handleDrop(e: DragEvent, targetColumn: string) {
		e.preventDefault();

		if (!draggedColumn || draggedColumn === targetColumn || !cleanDatasetName) {
			dragOverColumn = null;
			return;
		}

		const fromIndex = displayData.columns.indexOf(draggedColumn);
		const toIndex = displayData.columns.indexOf(targetColumn);

		// Create new columns array
		const newColumns = [...displayData.columns];
		newColumns.splice(fromIndex, 1);
		newColumns.splice(toIndex, 0, draggedColumn);

		// Update both local state and store
		displayData.columns = newColumns;
		vlmStore.updateColumnOrder(cleanDatasetName, newColumns);

		dragOverColumn = null;
		draggedColumn = null;
	}

	function handleDragStart(e: DragEvent, column: string) {
		draggedColumn = column;
		if (e.dataTransfer) {
			e.dataTransfer.effectAllowed = 'move';
			e.dataTransfer.setData('text/plain', column);
		}
	}

	function handleDragOver(e: DragEvent, column: string) {
		e.preventDefault();
		if (draggedColumn === column) return;
		dragOverColumn = column;
		e.dataTransfer!.dropEffect = 'move';
	}
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
			<div class="h-[calc(100vh-14rem)] w-full">
				<div class="h-full overflow-auto">
					<table class="w-full table-fixed border-collapse">
						<thead class="sticky top-0 z-10">
							<tr class="bg-card">
								{#each displayData.columns as column}
									<th
										class="group/header relative whitespace-nowrap border bg-card p-2 text-left font-semibold
										   {dragOverColumn === column ? 'border-l-2 border-primary' : ''}"
										style="width: {vlmStore.getColumnWidths(cleanDatasetName)[column] || 150}px"
										draggable={true}
										ondragstart={(e) => handleDragStart(e, column)}
										ondragover={(e) => handleDragOver(e, column)}
										ondrop={(e) => handleDrop(e, column)}
									>
										<div class="flex h-full select-none items-center gap-2">
											<DragHandle />
											<span class="flex-1">{column}</span>
											<ResizeHandle onResize={(width) => handleResize(column, width)} />
										</div>
									</th>
								{/each}
							</tr>
						</thead>
						<tbody>
							{#each displayData.rows as row}
								<tr class="hover:bg-muted/50">
									{#each displayData.columns as column}
										<td
											class="overflow-hidden text-ellipsis border p-2"
											style="width: {columnWidths[column] || 150}px"
										>
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
		</div>
	{:else}
		<div class="rounded-lg border p-4 text-center text-muted-foreground">
			No value level metadata available for this dataset
		</div>
	{/if}
</div>
