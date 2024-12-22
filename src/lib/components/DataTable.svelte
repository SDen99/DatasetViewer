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
	import { onMount, onDestroy } from 'svelte';
	import { browser } from '$app/environment';
	import { selectedColumns, columnOrder, columnWidths, datasetActions } from '$lib/stores/stores';

	export let data: any[];

	let draggedColumn: string | null = null;
	let dragOverColumn: string | null = null;
	let resizingColumn: string | null = null;
	let startX: number = 0;
	let startWidth: number = 0;
	let scrollContainer: HTMLElement;
	let mounted = false;

	// Virtualization constants
	const ROW_HEIGHT = 35; // Height of each row in pixels
	const BUFFER_SIZE = 5; // Number of rows to render above/below viewport
	let viewportHeight = 0;
	let scrollTop = 0;
	let visibleStartIndex = 0;
	let visibleEndIndex = 0;

	const MIN_COLUMN_WIDTH = 100;
	const DEFAULT_COLUMN_WIDTH = 200;

	// Virtualization state
	$: {
		if (mounted && scrollContainer) {
			viewportHeight = scrollContainer.clientHeight;
			const visibleRows = Math.ceil(viewportHeight / ROW_HEIGHT);
			visibleStartIndex = Math.max(0, Math.floor(scrollTop / ROW_HEIGHT) - BUFFER_SIZE);
			visibleEndIndex = Math.min(
				data.length,
				visibleStartIndex + visibleRows + 2 * BUFFER_SIZE
			);
		}
	}

	function handleScroll(event: Event) {
		scrollTop = (event.target as HTMLElement).scrollTop;
	}

	onMount(() => {
		mounted = true;
		if (!browser) return;

		// Initial viewport calculation
		if (scrollContainer) {
			viewportHeight = scrollContainer.clientHeight;
			const visibleRows = Math.ceil(viewportHeight / ROW_HEIGHT);
			visibleEndIndex = Math.min(data.length, visibleRows + 2 * BUFFER_SIZE);
		}
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
			: [];

	// Updated visibleData computation using virtualization
	$: visibleData =
		mounted && browser && data && visibleColumns.length > 0
			? data.slice(visibleStartIndex, visibleEndIndex).map((row) => {
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

	$: totalHeight = data ? data.length * ROW_HEIGHT : 0;

	$: getColumnStyle = (column: string) => {
		const width = $columnWidths[column] || DEFAULT_COLUMN_WIDTH;
		return `width: ${width}px; min-width: ${width}px; max-width: ${width}px;`;
	};

	onDestroy(() => {
		document.removeEventListener('mousemove', handleMouseMove);
		document.removeEventListener('mouseup', stopResize);
	});
</script>

{#if browser}
	<div class="relative h-full overflow-hidden">
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

				<!-- Scrollable body with virtualization -->
				<div
					bind:this={scrollContainer}
					class="overflow-y-auto"
					style="max-height: calc(100vh - 41px);"
					on:scroll={handleScroll}
				>
					<div style="height: {totalHeight}px; position: relative;">
						<div style="position: absolute; top: {visibleStartIndex * ROW_HEIGHT}px; left: 0; right: 0;">
							<Table>
								<TableBody>
									{#each visibleData as row, i (visibleStartIndex + i)}
										<TableRow style="height: {ROW_HEIGHT}px;">
											{#each visibleColumns as column}
												<TableCell
													style={getColumnStyle(column)}
													class="border-b border-l border-gray-200 p-1 truncate"
												>
													{row[column]}
												</TableCell>
											{/each}
										</TableRow>
									{/each}
								</TableBody>
							</Table>
						</div>
					</div>
				</div>
			</div>
		</div>
	</div>
{/if}