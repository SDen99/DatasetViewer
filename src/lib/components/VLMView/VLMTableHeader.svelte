<script lang="ts">
	import DragHandle from '$lib/components/data/DataTable/DragHandle.svelte';
	import ResizeHandle from '$lib/components/data/DataTable/ResizeHandle.svelte';
	import { vlmStore } from '$lib/core/stores/VLMStore.svelte';

	let {
		visibleColumns,
		cleanDatasetName,
		draggedColumn,
		dragOverColumn,
		onDragStart,
		onDragOver,
		onDrop,
		onResize
	} = $props<{
		visibleColumns: string[];
		cleanDatasetName: string;
		draggedColumn: string | null;
		dragOverColumn: string | null;
		onDragStart?: (data: { event: DragEvent, column: string }) => void;
		onDragOver?: (data: { event: DragEvent, column: string }) => void;
		onDrop?: (data: { event: DragEvent, column: string }) => void;
		onResize?: (data: { column: string, width: number }) => void;
	}>();

	// Handle drag start event
	function handleDragStart(event: DragEvent, column: string) {
		onDragStart?.({ event, column });
	}

	// Handle drag over event
	function handleDragOver(event: DragEvent, column: string) {
		onDragOver?.({ event, column });
	}

	// Handle drop event
	function handleDrop(event: DragEvent, column: string) {
		onDrop?.({ event, column });
	}

	// Handle resize event
	function handleResize(column: string, width: number) {
		onResize?.({ column, width });
	}
	
	// Get column width from the store
	function getColumnWidth(datasetName: string, column: string): number {
		if (!column || !datasetName) return 150;

		try {
			const storeWidths = vlmStore.getColumnWidths(datasetName);
			if (storeWidths && typeof storeWidths[column] === 'number' && storeWidths[column] > 0) {
				return storeWidths[column];
			}
		} catch (e) {
			console.warn(`Error getting width from store for ${column}:`, e);
		}

		// Default width
		return 150;
	}
</script>

<thead class="sticky top-0 z-10">
	<tr>
		{#each visibleColumns as column}
			<th
				class="group/header relative whitespace-nowrap border bg-muted p-2 text-left font-semibold text-muted-foreground
				{dragOverColumn === column ? 'border-l-2 border-primary' : ''}"
				style="width: {getColumnWidth(cleanDatasetName, column)}px"
				data-column={column}
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