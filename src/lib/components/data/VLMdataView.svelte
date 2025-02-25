<script lang="ts">
	import DragHandle from '$lib/components/data/DataTable/DragHandle.svelte';
	import ResizeHandle from '$lib/components/data/DataTable/ResizeHandle.svelte';
	import ExpandableCell from './ExpandableCell.svelte';
	import { Alert, AlertDescription } from '$lib/components/core/alert';
	import { Button } from '$lib/components/core/button';
	import type { ParsedDefineXML } from '$lib/types/define-xml';
	import { normalizeDatasetId } from '$lib/core/utils/datasetUtils';
	import { createVLMProcessor } from './VLMProcessor.svelte';
	import { vlmStore } from '$lib/core/stores/VLMStore.svelte';
	import type { MaterializedCellValue } from '$lib/core/processors/defineXML/MaterializedVLM';

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
	let columnWidths = $state<Record<string, number>>({});
	let showDuplicatesOnly = $state(false);

	// Declare filteredRows as a state variable with proper typing
	let filteredRows = $state<RowData[]>([]);

	// Update filtered rows whenever relevant state changes
	$effect(() => {
		if (!displayData.rows) {
			filteredRows = [];
			return;
		}

		if (showDuplicatesOnly) {
			filteredRows = displayData.rows.filter((row) => row._duplicateSource !== null);
		} else {
			filteredRows = displayData.rows;
		}
	});

	// Effect to handle define changes and processing
	$effect(() => {
		activeDefine = sdtmDefine || adamDefine; // Use destructured variables directly
		cleanDatasetName = datasetName ? normalizeDatasetId(datasetName) : '';

		if (activeDefine && cleanDatasetName) {
			processor.process(activeDefine, cleanDatasetName);
		}
	});

	// Process materialized VLM data into display format
	$effect(() => {
		const materializedData = processor.materializedData();
		const processingStatus = processor.status();

		console.log('Processing Materialized VLM Data:', {
			status: processingStatus,
			data: materializedData
		});

		if (processingStatus === 'error') {
			processingError = processor.error() || 'Unknown error occurred';
			displayData = { hasData: false };
			return;
		}

		if (!materializedData) {
			console.log('No materialized VLM data available');
			displayData = { hasData: false };
			return;
		}

		try {
			// We can use the materializedData directly now
			const columns = materializedData.columns;
			const rows = materializedData.rows.map((row) => {
				// Convert the Map to a regular object for easier use in the template
				const rowData: Record<string, any> = {
					PARAMCD: row.paramcd,
					PARAM: row.param,
					_whereClauseText: row.whereClauseText || '',
					_duplicateSource: row.duplicateSource || null,
					_duplicateValue: row.duplicateValue || null,
					_rowOrder: row.rowOrder
				};

				// Add all cell values
				row.cells.forEach((cell, colName) => {
					rowData[colName] = cell;
				});

				return rowData;
			});

			// Get column widths from store or use defaults
			const newColumnWidths: Record<string, number> = {};
			columns.forEach((column) => {
				newColumnWidths[column] = vlmStore.getColumnWidths(cleanDatasetName)[column] || 150;
			});
			columnWidths = newColumnWidths;

			displayData = {
				hasData: true,
				columns: columns,
				rows: rows
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
			columnWidths = { ...columnWidths, [column]: width };
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

	function getRowClass(row: any): string {
		let baseClass = '';

		// Add styling for duplicate rows
		if (row._duplicateSource) {
			baseClass += 'border-l-4 border-blue-400 bg-blue-50/20';
		}

		return baseClass;
	}

	function formatCellContent(cell: MaterializedCellValue, column: string): string {
		// If cell is null or undefined, return empty string
		if (!cell) return '';

		// Start with an empty content string
		let content = '';

		// If cell is a complex object with a value property
		if (typeof cell === 'object' && cell !== null) {
			// First add the main value if it exists
			if ('value' in cell && cell.value !== null && cell.value !== undefined) {
				content += `<div class="font-medium">${cell.value}</div>`;
			}

			// Add description if it exists (might be in 'display' property)
			if ('display' in cell && cell.display) {
				content += `<div class="text-sm mt-1">${cell.display}</div>`;
			}

			// Add origin information in a structured way
			if ('originType' in cell && cell.originType) {
				content += `
        <div class="mt-2">
          <div class="text-xs font-medium text-slate-500">ORIGIN:</div>
          <div class="text-sm">${cell.originType}</div>
      `;

				if ('originSource' in cell && cell.originSource) {
					content += `<div class="text-xs mt-1 text-slate-500">SOURCE: ${cell.originSource}</div>`;
				}

				content += `</div>`;
			}

			// Add method information in a structured way
			if (
				('methodDescription' in cell && cell.methodDescription) ||
				('methodOID' in cell && cell.methodOID)
			) {
				content += `
        <div class="mt-2">
          <div class="text-xs font-medium text-slate-500">METHOD:</div>
          <div class="text-sm">${cell.methodDescription || cell.methodOID || ''}</div>
        </div>
      `;
			}

			// Add comment information
			if ('commentText' in cell && cell.commentText) {
				content += `
        <div class="mt-2">
          <div class="text-xs font-medium text-slate-500">COMMENT:</div>
          <div class="text-sm">${cell.commentText}</div>
        </div>
      `;
			}

			// If we have content, return it
			if (content.length > 0) {
				return content;
			}

			// If it's an object but we couldn't extract structured data,
			// try to return the most meaningful representation
			try {
				// Try to extract a sensible string representation
				return JSON.stringify(cell, null, 2);
			} catch (e) {
				// Fallback - just return the toString() representation
				return String(cell);
			}
		}

		// For simple values (string, number, boolean)
		return String(cell);
	}
	function toggleDuplicatesOnly() {
		showDuplicatesOnly = !showDuplicatesOnly;
	}
</script>

<div class="space-y-6">
	<!-- Dataset Header Info -->
	<div class="flex items-center justify-between">
		<div>
			<h2 class="text-2xl font-bold tracking-tight">{cleanDatasetName} Value Level Metadata</h2>
			{#if activeDefine}
				<p class="text-sm text-muted-foreground">Showing materialized dataset structure</p>
			{/if}
		</div>

		{#if displayData.hasData && processor.materializedData() && processor.materializedData()?.duplicateSources.length > 0}
			<Button
				variant={showDuplicatesOnly ? 'default' : 'outline'}
				size="sm"
				onclick={toggleDuplicatesOnly}
			>
				{showDuplicatesOnly ? 'Show All Rows' : 'Show Duplicates Only'}
			</Button>
		{/if}
	</div>

	<!-- Main content -->
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
										class="group relative whitespace-nowrap border bg-muted p-2 text-left font-semibold
										{dragOverColumn === column ? 'border-l-2 border-primary' : ''}"
										style="width: {columnWidths[column]}px"
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
							{#each filteredRows as row}
								<tr class="{getRowClass(row)} hover:bg-muted/50">
									{#each displayData.columns as column}
										<td
											class="overflow-hidden text-ellipsis border p-2 align-top
											{row._duplicateSource && column === row._duplicateSource ? 'bg-blue-100 font-medium' : ''}"
											style="width: {columnWidths[column]}px"
										>
											{#if column === 'PARAMCD' || column === 'PARAM'}
												{#if typeof row[column] === 'object' && row[column] && 'value' in row[column]}
													{row[column].value || ''}
												{:else}
													{row[column] || ''}
												{/if}

												{#if column === 'PARAMCD' && row._whereClauseText && !row._duplicateSource}
													<div class="mt-1 text-xs text-muted-foreground">
														Where: {row._whereClauseText}
													</div>
												{/if}
											{:else if row[column]}
												<ExpandableCell content={formatCellContent(row[column], column)} />
											{:else}
												<span class="text-muted-foreground">—</span>
											{/if}

											{#if row._duplicateSource === column}
												<div class="mt-1 text-xs font-medium text-blue-600">
													{row._duplicateValue}
												</div>
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

		<!-- Duplicate information legend -->
		{#if processor.materializedData() && processor.materializedData()?.duplicateSources.length > 0}
			<div class="mt-4 rounded-md border bg-slate-50 p-4">
				<h3 class="mb-2 text-lg font-medium">Dataset Duplication Information</h3>
				<p class="mb-2">The following variables can create duplicate records in this dataset:</p>
				<div class="flex flex-wrap gap-2">
					{#each processor.materializedData()?.duplicateSources || [] as source}
						<span class="rounded bg-blue-100 px-2 py-1 text-sm">{source}</span>
					{/each}
				</div>
				<div class="my-4 h-px bg-slate-200"></div>
				<p class="text-sm text-muted-foreground">
					Rows with blue left borders indicate records that would be duplicated in the dataset due
					to these variables.
				</p>
			</div>
		{/if}
	{:else}
		<div class="rounded-lg border p-4 text-center text-muted-foreground">
			No value level metadata available for this dataset
		</div>
	{/if}
</div>
