<script lang="ts">
	import { onMount } from 'svelte';
	import { browser } from '$app/environment';
	import { dataTableStore } from '$lib/stores/dataTableStore.svelte';
	import DataTableHeader from './DataTableHeader.svelte';
	import DataTableBody from './DataTableBody.svelte';
	import { Table } from '$lib/components/ui/table';
	import { TableHeader, TableRow, TableHead, TableBody, TableCell } from '$lib/components/ui/table';

	let lastStoreState = $state<{
		columnOrder: string[];
		selectedColumns: Set<string>;
	}>({ columnOrder: [], selectedColumns: new Set() });
	/*
	$effect(() => {
		$inspect({
			columnOrder: dataTableStore.columnOrder,
			selectedColumns: dataTableStore.selectedColumns,
			data: data?.length
		});
	});
*/
	// Props and state
	let { data = [] } = $props<{
		data: Record<string, any>[];
	}>();

	// UI State
	let mounted = $state(false);
	let scrollContainer = $state<HTMLElement | null>(null);
	let scrollTop = $state(0);
	let viewportHeight = $state(0);
	let visibleStartIndex = $state(0);
	let visibleEndIndex = $state(0);
	let sort = $state<{ column: string | null; direction: 'asc' | 'desc' | null }>({
		column: null,
		direction: null
	});

	// Constants
	const ROW_HEIGHT = 35;
	const BUFFER_SIZE = 5;
	const DEFAULT_COLUMN_WIDTH = 200;

	// Derived values
	let visibleColumns = $derived.by(() => {
		const order = dataTableStore.columnOrder;
		const selected = dataTableStore.selectedColumns;
		return order.filter((col) => selected.has(col));
	});

	let totalWidth = $derived(
		visibleColumns.reduce(
			(sum, col) => sum + (dataTableStore.columnWidths[col] || DEFAULT_COLUMN_WIDTH),
			0
		)
	);

	// Sorting logic
	let sortedData = $derived.by(() => {
		/*	console.log('Computing sortedData:', {
			inputData: data,
			hasSort: sort.column && sort.direction
		});*/
		if (!Array.isArray(data)) return [];
		if (!sort.column || !sort.direction) return data;

		return [...data].sort((a, b) => {
			const aVal = a[sort.column!];
			const bVal = b[sort.column!];

			if (aVal == null && bVal == null) return 0;
			if (aVal == null) return sort.direction === 'asc' ? -1 : 1;
			if (bVal == null) return sort.direction === 'asc' ? 1 : -1;

			const comparison = String(aVal).localeCompare(String(bVal));
			return sort.direction === 'asc' ? comparison : -comparison;
		});
	});

	// Visible data calculation
	let visibleData = $derived.by(() => {
		/*	console.log('Computing visibleData:', {
			mounted,
			browser,
			dataLength: sortedData?.length,
			columnsLength: visibleColumns?.length,
			visibleStartIndex,
			visibleEndIndex
		});*/

		if (!mounted || !browser || !Array.isArray(sortedData) || !visibleColumns.length) {
			return [];
		}

		return sortedData.slice(visibleStartIndex, visibleEndIndex);
	});
	let selectedRowId = $state<string | null>(null);

	function handleRowClick(row: Record<string, any>) {
		selectedRowId = null;
	}

	// Event handlers
	function handleScroll(event: Event) {
		if (!scrollContainer) return;

		scrollTop = (event.target as HTMLElement).scrollTop;
		const visibleRows = Math.ceil(viewportHeight / ROW_HEIGHT);
		visibleStartIndex = Math.max(0, Math.floor(scrollTop / ROW_HEIGHT) - BUFFER_SIZE);
		visibleEndIndex = Math.min(
			sortedData.length,
			visibleStartIndex + visibleRows + 2 * BUFFER_SIZE
		);
		/*
		console.log('Scroll event:', {
			scrollTop,
			visibleRows,
			visibleStartIndex,
			visibleEndIndex
		});*/
	}

	function handleColumnReorder(fromColumn: string, toColumn: string) {
		dataTableStore.updateColumnOrder(
			dataTableStore.columnOrder.map((col) =>
				col === fromColumn ? toColumn : col === toColumn ? fromColumn : col
			)
		);
	}

	function handleColumnResize(column: string, width: number) {
		dataTableStore.updateColumnWidth(column, width);
	}

	function toggleSort(column: string) {
		if (sort.column === column) {
			if (sort.direction === 'asc') {
				sort = { column, direction: 'desc' };
			} else if (sort.direction === 'desc') {
				sort = { column: null, direction: null };
			} else {
				sort = { column, direction: 'asc' };
			}
		} else {
			sort = { column, direction: 'asc' };
		}
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

	let totalHeight = $derived(Array.isArray(sortedData) ? sortedData.length * ROW_HEIGHT : 0);

	$effect(() => {
		if (mounted && scrollContainer && Array.isArray(sortedData)) {
			// Get the actual visible height of the scroll container
			const containerHeight = scrollContainer.getBoundingClientRect().height;
			viewportHeight = containerHeight;

			const visibleRows = Math.ceil(viewportHeight / ROW_HEIGHT);
			visibleStartIndex = Math.max(0, Math.floor(scrollTop / ROW_HEIGHT) - BUFFER_SIZE);
			visibleEndIndex = Math.min(
				sortedData.length,
				visibleStartIndex + visibleRows + 2 * BUFFER_SIZE
			);
			/*
			console.log('Updated viewport:', {
				containerHeight,
				viewportHeight,
				visibleRows,
				visibleStartIndex,
				visibleEndIndex
			});*/
		}
	});
</script>

{#if browser}
	<div class="relative flex h-full w-full flex-col overflow-hidden">
		<!-- Fixed header -->
		<div class="w-full overflow-x-auto bg-white">
			<div style="width: {totalWidth}px">
				<Table>
					<DataTableHeader
						columns={visibleColumns}
						{sort}
						onSort={toggleSort}
						onColumnReorder={handleColumnReorder}
						onColumnResize={handleColumnResize}
					/>
				</Table>
			</div>
		</div>

		<!-- Scrollable body -->
		<div class="flex-1 overflow-hidden" bind:this={scrollContainer}>
			<DataTableBody
				data={visibleData}
				columns={visibleColumns}
				{visibleStartIndex}
				{visibleEndIndex}
				rowHeight={ROW_HEIGHT}
				{totalHeight}
				{totalWidth}
				onScroll={handleScroll}
			/>
		</div>
	</div>
{/if}
