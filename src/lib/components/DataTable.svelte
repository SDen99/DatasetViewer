<script lang="ts">
	import {
		Table,
		TableBody,
		TableCell,
		TableHead,
		TableHeader,
		TableRow
	} from '$lib/components/ui/table';
	import { GripVertical } from 'lucide-svelte';
	import { onMount } from 'svelte';
	import { browser } from '$app/environment';
	import { selectedColumns, columnOrder, columnWidths, datasetActions } from '$lib/stores';

	// Keep data prop as it comes from the selected dataset
	export let data: any[];

	let draggedColumn: string | null = null;
	let dragOverColumn: string | null = null;
	let resizingColumn: string | null = null;
	let startX: number = 0;
	let startWidth: number = 0;
	let loadMoreTrigger: HTMLElement;
	let scrollContainer: HTMLElement;
	let pageSize = 50;
	let currentPage = 1;
	let mounted = false;

	const MIN_COLUMN_WIDTH = 100;
	const DEFAULT_COLUMN_WIDTH = 200;

	onMount(() => {
		mounted = true;

		if (!browser) return;

		// Initialize column selection if empty
		if (data && data.length > 0 && $selectedColumns.size === 0) {
			const initialColumns = Object.keys(data[0]).slice(0, 5);
			initialColumns.forEach((col) => {
				datasetActions.updateColumnSelection(col, true);
			});
		}

		// Initialize column order if empty
		if (data && data.length > 0 && $columnOrder.length === 0) {
			datasetActions.updateColumnOrder(Object.keys(data[0]));
		}

		const observer = new IntersectionObserver(
			(entries) => {
				entries.forEach((entry) => {
					if (entry.isIntersecting && currentPage * pageSize < data.length) {
						currentPage++;
					}
				});
			},
			{
				root: scrollContainer,
				rootMargin: '100px',
				threshold: 0
			}
		);

		if (loadMoreTrigger) {
			observer.observe(loadMoreTrigger);
		}

		return () => {
			if (loadMoreTrigger) {
				observer.unobserve(loadMoreTrigger);
			}
		};
	});

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
	}

	function handleDrop(e: DragEvent, targetColumn: string) {
		e.preventDefault();

		if (!draggedColumn || draggedColumn === targetColumn) {
			dragOverColumn = null;
			return;
		}

		const fromIndex = $columnOrder.indexOf(draggedColumn);
		const toIndex = $columnOrder.indexOf(targetColumn);

		const newOrder = [...$columnOrder];
		newOrder.splice(fromIndex, 1);
		newOrder.splice(toIndex, 0, draggedColumn);

		datasetActions.updateColumnOrder(newOrder);
		dragOverColumn = null;
		draggedColumn = null;
	}

	function handleDragLeave() {
		dragOverColumn = null;
	}

	function handleDragEnd() {
		draggedColumn = null;
		dragOverColumn = null;
	}

	function handleMouseMove(e: MouseEvent) {
		if (!resizingColumn) return;
		const diff = e.clientX - startX;
		const newWidth = Math.max(MIN_COLUMN_WIDTH, startWidth + diff);
		datasetActions.updateColumnWidth(resizingColumn, newWidth);
	}

	function startResize(e: MouseEvent, column: string) {
		e.preventDefault();
		e.stopPropagation();
		resizingColumn = column;
		startX = e.clientX;
		startWidth = $columnWidths[column] || DEFAULT_COLUMN_WIDTH;

		document.addEventListener('mousemove', handleMouseMove);
		document.addEventListener('mouseup', stopResize);
	}

	function stopResize() {
		resizingColumn = null;
		document.removeEventListener('mousemove', handleMouseMove);
		document.removeEventListener('mouseup', stopResize);
	}

	function handleKeyResize(e: KeyboardEvent, column: string) {
		if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
			e.preventDefault();
			const delta = e.key === 'ArrowLeft' ? -10 : 10;
			const currentWidth = $columnWidths[column] || DEFAULT_COLUMN_WIDTH;
			const newWidth = Math.max(MIN_COLUMN_WIDTH, currentWidth + delta);
			datasetActions.updateColumnWidth(column, newWidth);
		}
	}

	$: visibleColumns =
		$columnOrder.length > 0 && $selectedColumns.size > 0
			? $columnOrder.filter((col) => $selectedColumns.has(col))
			: data && data.length > 0
				? Object.keys(data[0]).slice(0, 5)
				: [];

	// Update visibleData to use more reliable visibleColumns
	$: visibleData =
		mounted && browser && data && visibleColumns.length > 0
			? data.slice(0, currentPage * pageSize).map((row) => {
					const visibleRowData: Record<string, any> = {};
					visibleColumns.forEach((col) => {
						visibleRowData[col] = row[col];
					});
					return visibleRowData;
				})
			: [];

	$: totalWidth = visibleColumns.reduce(
		(sum, col) => sum + ($columnWidths[col] || DEFAULT_COLUMN_WIDTH),
		0
	);

	$: getColumnStyle = (column: string) => {
		const width = $columnWidths[column] || DEFAULT_COLUMN_WIDTH;
		return `width: ${width}px; min-width: ${width}px; max-width: ${width}px;`;
	};

	$: console.log('Core state:', {
		datasetFirstRow: data?.[0],
		selectedColumnsSize: $selectedColumns.size,
		columnOrderLength: $columnOrder.length,
		mounted,
		browser
	});

	$: if (data && data.length > 0) {
		console.log('Dataset changed, initializing columns');

		// Clear existing state
		selectedColumns.set(new Set());
		columnOrder.set([]);

		// Get all possible columns
		const allColumns = Object.keys(data[0]);

		// Set the column order first
		datasetActions.updateColumnOrder(allColumns);

		// Then select the first 5 columns
		allColumns.slice(0, 5).forEach((col) => {
			datasetActions.updateColumnSelection(col, true);
		});
	}

	// Log the visible data mapping
	$: {
		if (mounted && browser && data) {
			const sampleRow = data[0];
			const mappedRow: Record<string, any> = {};
			visibleColumns.forEach((col) => {
				mappedRow[col] = sampleRow[col];
			});
			console.log('Visible data mapping:', {
				originalRow: sampleRow,
				visibleColumns,
				mappedResult: mappedRow
			});
		}
	}

	$: if (data && data.length > 0) {
		// Clear previous column state when data changes
		selectedColumns.set(new Set());

		// Initialize columns for new dataset
		const defaultColumns = Object.keys(data[0]);

		// Set new column order
		datasetActions.updateColumnOrder(defaultColumns);

		// Select first 5 columns by default
		defaultColumns.slice(0, 5).forEach((col) => {
			datasetActions.updateColumnSelection(col, true);
		});
	}

	$: {
		const debugVisibleCols =
			$columnOrder.length > 0
				? $columnOrder.filter((col) => $selectedColumns.has(col))
				: data && data.length > 0
					? Object.keys(data[0]).filter((col) => $selectedColumns.has(col))
					: [];
		console.log('Visible columns calculation:', {
			usingColumnOrder: $columnOrder.length > 0,
			columnOrder: $columnOrder,
			selectedColumns: Array.from($selectedColumns),
			result: debugVisibleCols
		});
	}
</script>

{#if browser}
	<div class="relative h-full overflow-hidden">
		<!-- Debug info (temporary) -->
		<pre class="bg-gray-100 p-2 text-xs">
            {JSON.stringify(
				{ visibleColumns, dataLength: data?.length, firstRow: visibleData[0] },
				null,
				2
			)}
        </pre>

		<!-- Main scroll container -->
		<div class="overflow-x-auto">
			<div style="width: {totalWidth}px">
				<!-- Fixed header -->
				<div class="sticky top-0 z-10 bg-background">
					<Table>
						<TableHeader>
							<TableRow>
								{#each visibleColumns as column}
									<TableHead
										class="relative {dragOverColumn === column ? 'border-l-2 border-primary' : ''}"
										style={getColumnStyle(column)}
									>
										<div
											class="flex h-full items-center gap-2"
											draggable={true}
											role="button"
											tabindex="0"
											on:dragstart={(e) => handleDragStart(e, column)}
											on:dragover={(e) => handleDragOver(e, column)}
											on:dragleave={handleDragLeave}
											on:drop={(e) => handleDrop(e, column)}
											on:dragend={handleDragEnd}
										>
											<div class="cursor-move rounded p-1 hover:bg-muted">
												<GripVertical class="h-4 w-4 text-muted-foreground" />
											</div>
											<span class="select-none">{column}</span>
											<button
												type="button"
												aria-label="Resize column"
												class="absolute right-0 top-0 h-full w-0.5 cursor-col-resize bg-gray-300 p-0 hover:w-1 hover:bg-primary focus:bg-primary focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
												on:mousedown={(e) => startResize(e, column)}
												on:keydown={(e) => handleKeyResize(e, column)}
											></button>
										</div>
									</TableHead>
								{/each}
							</TableRow>
						</TableHeader>
					</Table>
				</div>

				<!-- Scrollable body -->
				<div
					bind:this={scrollContainer}
					class="overflow-y-auto"
					style="max-height: calc(100vh - 41px);"
				>
					<Table>
						<TableBody>
							{#each visibleData as row}
								<TableRow>
									{#each visibleColumns as column}
										<TableCell
											style={getColumnStyle(column)}
											class="border-b border-l border-gray-200"
										>
											{row[column]}
										</TableCell>
									{/each}
								</TableRow>
							{/each}
							<tr bind:this={loadMoreTrigger} class="h-1"></tr>
						</TableBody>
					</Table>
				</div>
			</div>
		</div>
	</div>
{/if}
