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

	export let data: any[];
	export let selectedColumns: Set<string>;
	export let columnOrder: string[];
	export let columnWidths: Record<string, number>;
	export let onReorderColumns: (newOrder: string[]) => void;
	export let onResizeColumn: (column: string, width: number) => void;

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

		const fromIndex = columnOrder.indexOf(draggedColumn);
		const toIndex = columnOrder.indexOf(targetColumn);

		const newOrder = [...columnOrder];
		newOrder.splice(fromIndex, 1);
		newOrder.splice(toIndex, 0, draggedColumn);

		onReorderColumns(newOrder);
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
		onResizeColumn(resizingColumn, newWidth);
	}

	function startResize(e: MouseEvent, column: string) {
		e.preventDefault();
		e.stopPropagation();
		resizingColumn = column;
		startX = e.clientX;
		startWidth = columnWidths[column] || DEFAULT_COLUMN_WIDTH;

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
			const currentWidth = columnWidths[column] || DEFAULT_COLUMN_WIDTH;
			const newWidth = Math.max(MIN_COLUMN_WIDTH, currentWidth + delta);
			onResizeColumn(column, newWidth);
		}
	}

	$: visibleColumns = columnOrder.filter((col) => selectedColumns.has(col));
	$: visibleData =
		mounted && browser
			? data.slice(0, currentPage * pageSize).map((row) => {
					const visibleRowData: Record<string, any> = {};
					visibleColumns.forEach((col) => {
						visibleRowData[col] = row[col];
					});
					return visibleRowData;
				})
			: [];

	$: totalWidth = visibleColumns.reduce(
		(sum, col) => sum + (columnWidths[col] || DEFAULT_COLUMN_WIDTH),
		0
	);

	$: getColumnStyle = (column: string) => {
		const width = columnWidths[column] || DEFAULT_COLUMN_WIDTH;
		return `width: ${width}px; min-width: ${width}px; max-width: ${width}px;`;
	};
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
												class="absolute right-0 top-0 h-full w-1 cursor-col-resize bg-transparent p-0 hover:bg-primary focus:bg-primary focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
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
										<TableCell style={getColumnStyle(column)}>
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
