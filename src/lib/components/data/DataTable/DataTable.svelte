<script lang="ts">
	import { onMount } from 'svelte';
	import { browser } from '$app/environment';
	import { tableUIStore } from '$lib/core/stores/tableUIStore.svelte';
	import { sortStore } from '$lib/core/stores/sortStore.svelte';
	import DataTableHeader from './DataTableHeader.svelte';
	import DataTableBody from './DataTableBody.svelte';
	import { untrack } from 'svelte';

	// Props and state
	let { data = [] } = $props<{
		data: Record<string, any>[];
	}>();

	// UI State
	let headerContainer = $state<HTMLElement | null>(null);
	let scrollContainer = $state<HTMLElement | null>(null);
	let scrollLeft = $state(0);
	let scrollTop = $state(0);
	let viewportHeight = $state(0);
	let visibleStartIndex = $state(0);
	let visibleEndIndex = $state(0);
	let mounted = $state(false);

	// Constants
	const ROW_HEIGHT = 35;
	const BUFFER_SIZE = 5;
	const DEFAULT_COLUMN_WIDTH = 200;

	// Derived values
	let visibleColumns = $derived.by(() => {
		const order = tableUIStore.columnOrder;
		const selected = tableUIStore.selectedColumns;
		return order.filter((col) => selected.has(col));
	});

	let totalWidth = $derived(
		visibleColumns.reduce(
			(sum, col) => sum + (tableUIStore.columnWidths[col] || DEFAULT_COLUMN_WIDTH),
			0
		)
	);

	// Sorting logic
	let sortedData = $derived.by(() => {
		if (!Array.isArray(data)) return [];
		if (sortStore.sort.length === 0) return data;

		return [...data].sort((a, b) => {
			for (const { column, direction } of sortStore.sort) {
				const aVal = a[column];
				const bVal = b[column];

				// Improved null handling
				if (aVal === null || aVal === undefined) {
					if (bVal === null || bVal === undefined) continue;
					return direction === 'asc' ? -1 : 1;
				}
				if (bVal === null || bVal === undefined) return direction === 'asc' ? 1 : -1;

				// Type-aware comparison
				const comparison =
					typeof aVal === 'number' && typeof bVal === 'number'
						? aVal - bVal
						: String(aVal).localeCompare(String(bVal));

				if (comparison !== 0) {
					return direction === 'asc' ? comparison : -comparison;
				}
			}
			return 0;
		});
	});

	let totalHeight = $derived(Array.isArray(sortedData) ? sortedData.length * ROW_HEIGHT : 0);

	// Visible data calculation
	let visibleData = $derived.by(() => {
		if (!mounted || !browser || !Array.isArray(sortedData) || !visibleColumns.length) {
			return [];
		}

		return sortedData.slice(visibleStartIndex, visibleEndIndex);
	});
	let selectedRowId = $state<string | null>(null);

	function handleHorizontalScroll(event: Event) {
		const target = event.target as HTMLElement;
		scrollLeft = target.scrollLeft;

		if (target === headerContainer && scrollContainer) {
			scrollContainer.scrollLeft = scrollLeft;
		} else if (target === scrollContainer && headerContainer) {
			headerContainer.scrollLeft = scrollLeft;
		}
	}

	// Event handlers
	function handleScroll(event: Event) {
		if (!scrollContainer) return;

		scrollTop = untrack(() => (event.target as HTMLElement).scrollTop);
		const visibleRows = Math.ceil(viewportHeight / ROW_HEIGHT);
		visibleStartIndex = Math.max(0, Math.floor(scrollTop / ROW_HEIGHT) - BUFFER_SIZE);
		visibleEndIndex = Math.min(
			sortedData.length,
			visibleStartIndex + visibleRows + 2 * BUFFER_SIZE
		);
	}

	function handleColumnReorder(fromColumn: string, toColumn: string) {
		tableUIStore.updateColumnOrder(
			tableUIStore.columnOrder.map((col) =>
				col === fromColumn ? toColumn : col === toColumn ? fromColumn : col
			)
		);
	}

	function handleColumnResize(column: string, width: number) {
		tableUIStore.updateColumnWidth(column, width);
	}

	onMount(() => {
		mounted = true;
		if (!browser) return;

		if (scrollContainer) {
			/*	console.log('Scroll container dimensions:', {
				height: scrollContainer.clientHeight,
				offsetHeight: scrollContainer.offsetHeight
			});*/
			viewportHeight = scrollContainer.clientHeight;
			const visibleRows = Math.ceil(viewportHeight / ROW_HEIGHT);
			visibleEndIndex = Math.min(data.length, visibleRows + 2 * BUFFER_SIZE);

			// Force a recalculation
			handleScroll({ target: scrollContainer } as any);
		}
	});

	function handleSort(column: string) {
		sortStore.toggleSort(column);
	}

	$effect(() => {
		if (mounted && scrollContainer && Array.isArray(sortedData)) {
			const containerHeight = scrollContainer.getBoundingClientRect().height;
			viewportHeight = containerHeight;

			const visibleRows = Math.ceil(viewportHeight / ROW_HEIGHT);
			visibleStartIndex = Math.max(0, Math.floor(scrollTop / ROW_HEIGHT) - BUFFER_SIZE);
			visibleEndIndex = Math.min(
				sortedData.length,
				visibleStartIndex + visibleRows + 2 * BUFFER_SIZE
			);
		}
	});
</script>

{#if browser}
	<!-- Root container - no scroll -->
	<div class="relative flex h-full w-full flex-col">
		<!-- Single horizontal scroll container -->
		<div
			bind:this={headerContainer}
			class="w-full flex-1 overflow-x-auto overflow-y-hidden"
			onscroll={handleHorizontalScroll}
		>
			<!-- Content wrapper with fixed width -->
			<div style="width: {totalWidth}px;">
				<!-- Fixed header -->
				<div class="sticky top-0 z-10 bg-white">
					<table class="w-full caption-bottom text-sm">
						<DataTableHeader
							columns={visibleColumns}
							sort={sortStore.sort}
							onSort={handleSort}
							onColumnReorder={handleColumnReorder}
							onColumnResize={handleColumnResize}
						/>
					</table>
				</div>

				<!-- Single scrollable container -->
				<div
					bind:this={scrollContainer}
					class="overflow-y-auto"
					style="height: calc(100vh - 9rem);"
					onscroll={handleScroll}
				>
					<DataTableBody
						data={visibleData}
						columns={visibleColumns}
						{visibleStartIndex}
						{visibleEndIndex}
						rowHeight={ROW_HEIGHT}
						{totalHeight}
						{totalWidth}
					/>
				</div>
			</div>
		</div>
	</div>
{/if}
