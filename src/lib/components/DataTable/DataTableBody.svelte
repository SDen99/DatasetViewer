<script lang="ts">
	import DataTableRow from './DataTableRow.svelte';

	let {
		data = [],
		columns = [],
		visibleStartIndex = 0,
		rowHeight = 35,
		totalHeight = 0
	} = $props<{
		data: Record<string, any>[];
		columns: string[];
		visibleStartIndex: number;
		visibleEndIndex: number;
		rowHeight: number;
		totalHeight: number;
		totalWidth: number;
	}>();
</script>

<div class="h-full w-full">
	<div style="height: {totalHeight}px; position: relative;">
		<div style="position: absolute; top: {visibleStartIndex * rowHeight}px; left: 0; right: 0;">
			<table class="w-full caption-bottom text-sm">
				<tbody>
					{#each data as row, i (visibleStartIndex + i)}
						<DataTableRow {row} {columns} height={rowHeight} index={visibleStartIndex + i} />
					{/each}
				</tbody>
			</table>
		</div>
	</div>
</div>
