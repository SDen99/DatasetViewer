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

	let { sdtmDefine, adamDefine, datasetName } = $props<{
		sdtmDefine: ParsedDefineXML | null;
		adamDefine: ParsedDefineXML | null;
		datasetName: string;
	}>();

	console.log('Inside VLMdataView', { sdtmDefine, adamDefine, datasetName });

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
		activeDefine = sdtmDefine || adamDefine; // Use destructured variables directly
		cleanDatasetName = datasetName ? normalizeDatasetId(datasetName) : '';

		if (activeDefine && cleanDatasetName) {
			processor.process(activeDefine, cleanDatasetName);
		}
	});

	// Process VLM data into display format
	$effect(() => {
		const vlmData = processor.vlmData();
		const processingStatus = processor.status();

		console.log('Processing VLM Data:', {
			status: processingStatus,
			data: vlmData
		});

		if (processingStatus === 'error') {
			processingError = processor.error() || 'Unknown error occurred';
			displayData = { hasData: false };
			return;
		}

		if (!vlmData?.variables || vlmData.variables.size === 0) {
			console.log('No VLM data available');
			displayData = { hasData: false };
			return;
		}

		try {
			const columns = new Set(['PARAMCD', 'PARAM']);
			const rows = new Map<string, any>();

			console.log('Starting data transformation', {
				variableCount: vlmData.variables.size,
				variables: Array.from(vlmData.variables.keys())
			});

			// First pass: Collect all variables and PARAMCDs
			vlmData.variables.forEach((variable, variableName) => {
				console.log('Processing variable:', {
					name: variableName,
					valueListDef: variable.valueListDef,
					hasItemRefs: !!variable.valueListDef.ItemRefs,
					itemRefsLength: variable.valueListDef.ItemRefs?.length || 0,
					// Add a sample ItemRef if available
					sampleItemRef: variable.valueListDef.ItemRefs?.[0]
				});

				if (!['PARAMCD', 'PARAM'].includes(variableName)) {
					columns.add(variableName);
				}

				// Add debugging before ItemRefs check
				console.log(`Checking ItemRefs for ${variableName}:`, {
					hasItemRefs: !!variable.valueListDef.ItemRefs,
					condition: variable.valueListDef.ItemRefs ? 'will process' : 'will skip'
				});

				// Process each ItemRef to create rows
				if (variable.valueListDef.ItemRefs) {
					console.log(`Processing ItemRefs for ${variableName}`, {
						count: variable.valueListDef.ItemRefs.length
					});

					variable.valueListDef.ItemRefs.forEach((itemRef) => {
						console.log(`Processing ItemRef:`, {
							paramcd: itemRef.paramcd,
							decode: itemRef.paramInfo?.decode
						});

						const paramcd = itemRef.paramcd;
						if (!rows.has(paramcd)) {
							rows.set(paramcd, {
								PARAMCD: paramcd,
								PARAM: itemRef.paramInfo?.decode || ''
							});
						}
					});
				}
			});

			// Second pass: Add variable information to rows
			vlmData.variables.forEach((variable, variableName) => {
				if (variableName !== 'PARAMCD' && variableName !== 'PARAM') {
					variable.valueListDef.ItemRefs.forEach((itemRef) => {
						const row = rows.get(itemRef.paramcd);
						if (row) {
							row[variableName] = itemRef;
						}
					});
				}
			});

			const sortedRows = Array.from(rows.values());

			console.log('Final transformed data:', {
				columnCount: columns.size,
				columns: Array.from(columns),
				rowCount: sortedRows.length,
				sampleRow: sortedRows[0]
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

		const columns = displayData.columns || [];
		const fromIndex = columns.indexOf(draggedColumn);
		const toIndex = columns.indexOf(targetColumn);
		const newColumns = [...columns];

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

	$effect(() => {
		console.log('Display Data Structure:', {
			columns: displayData.columns,
			rowCount: displayData.rows?.length,
			sampleRow: displayData.rows?.[0],
			allRows: displayData.rows
		});
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
											class="overflow-hidden text-ellipsis border p-2 align-top"
											style="width: {(columnWidths as Record<string, number>)[column] || 150}px"
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
