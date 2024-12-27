<script lang="ts">
	import { Table, TableBody } from '$lib/components/ui/table';
	import DataTableRow from './DataTableRow.svelte';

	let {
		data = [],
		columns = [],
		visibleStartIndex = 0,
		visibleEndIndex = 0,
		rowHeight = 35,
		totalHeight = 0,
		onScroll
	} = $props<{
		data: Record<string, any>[];
		columns: string[];
		visibleStartIndex: number;
		visibleEndIndex: number;
		rowHeight: number;
		totalHeight: number;
		onScroll: (e: Event) => void;
	}>();

	// Add more debugging
	/*	$effect(() => {
		console.log('DataTableBody render:', {
			dataLength: data?.length,
			columnsLength: columns?.length,
			visibleStartIndex,
			visibleEndIndex,
			totalHeight,
			rowHeight,
			shouldShowRows: data?.length > 0 && columns?.length > 0
		});
	});*/
</script>

<div class="flex-1 overflow-y-auto" onscroll={onScroll}>
	<div style="height: {totalHeight}px; position: relative;">
		<div style="position: absolute; top: {visibleStartIndex * rowHeight}px; left: 0; right: 0;">
			<Table>
				<TableBody>
					{#each data as row, i (visibleStartIndex + i)}
						<DataTableRow {row} {columns} height={rowHeight} index={visibleStartIndex + i} />
					{/each}
				</TableBody>
			</Table>
		</div>
	</div>
</div>
