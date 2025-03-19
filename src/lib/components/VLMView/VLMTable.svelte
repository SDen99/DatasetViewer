<script lang="ts">
	import { vlmStore } from '$lib/core/stores/VLMStore.svelte';
	import VLMTableHeader from '$lib/components/VLMView/VLMTableHeader.svelte';
	import VLMTableRow from '$lib/components/VLMView/VLMTableRow.svelte';

	let {
		displayData,
		filteredRows,
		visibleColumns,
		cleanDatasetName,
		stratificationColumns
	} = $props<{
		displayData: {
			hasData: boolean;
			columns?: string[];
			rows?: any[];
		};
		filteredRows: any[];
		visibleColumns: string[];
		cleanDatasetName: string;
		stratificationColumns: Set<string>;
	}>();

	let tableRef = $state<HTMLElement | null>(null);
	let isTableRendered = $state(false);
	let draggedColumn = $state<string | null>(null);
	let dragOverColumn = $state<string | null>(null);

	// Handle dragging columns
	function handleDragStart(e: DragEvent, column: string) {
		draggedColumn = column;
	}

	function handleDragOver(e: DragEvent, column: string) {
		e.preventDefault();
		if (visibleColumns.includes(column)) {
			dragOverColumn = column;
		}
	}

	function handleDrop(e: DragEvent, column: string) {
		e.preventDefault();
		if (draggedColumn && displayData.columns) {
			const draggedIndex = visibleColumns.indexOf(draggedColumn);
			const dropIndex = visibleColumns.indexOf(column);

			if (draggedIndex !== -1 && dropIndex !== -1) {
				// Get the full columns array
				const newColumns = [...displayData.columns];

				// Remove draggedColumn from its current position
				const draggedItem = newColumns.splice(newColumns.indexOf(draggedColumn), 1)[0];

				// Insert at new position relative to the drop target
				const targetIndex = newColumns.indexOf(column);
				newColumns.splice(targetIndex, 0, draggedItem);

				// This would need to dispatch an event to update parent state
				// or be handled by a store in a real implementation
				displayData = {
					...displayData,
					columns: newColumns
				};
			}
		}

		draggedColumn = null;
		dragOverColumn = null;
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

	// Handle column resize
	function handleResize(column: string, width: number) {
		if (!width || width < 50) return;

		try {
			// Update the store
			vlmStore.updateColumnWidth(cleanDatasetName, column, width);

			// Force an immediate DOM update
			forceUpdateColumnWidth(column, width);
		} catch (error) {
			console.error('Error updating column width:', error);
		}
	}

	// Force update column width in the DOM
	function forceUpdateColumnWidth(column: string, width: number) {
		if (!column || !width) return;

		const selector = `[data-column="${column}"]`;
		const elements = document.querySelectorAll(selector);

		elements.forEach((el) => {
			if (el instanceof HTMLElement) {
				// Set both width and min-width to ensure it takes effect
				el.style.width = `${width}px`;
				el.style.minWidth = `${width}px`;
				el.style.maxWidth = `${width}px`;
			}
		});
	}

	// Apply all column widths to the DOM
	function applyAllColumnWidths() {
		if (!displayData.columns || !cleanDatasetName) return;

		displayData.columns.forEach((column) => {
			const width = getColumnWidth(cleanDatasetName, column);
			const selector = `[data-column="${column}"]`;
			const elements = document.querySelectorAll(selector);

			elements.forEach((el) => {
				if (el instanceof HTMLElement) {
					// Set both width and min-width to ensure it takes effect
					el.style.width = `${width}px`;
					el.style.minWidth = `${width}px`;
					el.style.maxWidth = `${width}px`;
				}
			});
		});
	}

	// Set up table resize observer
	$effect(() => {
		if (tableRef && displayData.hasData && !isTableRendered) {
			isTableRendered = true;

			// Set up a resize observer to detect when table dimensions change
			const resizeObserver = new ResizeObserver(() => {
				applyAllColumnWidths();
			});

			resizeObserver.observe(tableRef);

			// Also apply widths immediately
			setTimeout(applyAllColumnWidths, 100);
		}
	});
</script>

<div class="rounded-lg border bg-card shadow-sm">
	<div class="w-full">
		<div class="h-[calc(100vh-24rem)] overflow-auto">
			<table class="w-full border-collapse" bind:this={tableRef}>
				<VLMTableHeader
					{visibleColumns}
					{cleanDatasetName}
					{draggedColumn}
					{dragOverColumn}
					onDragStart={(data) => handleDragStart(data.event, data.column)}
					onDragOver={(data) => handleDragOver(data.event, data.column)}
					onDrop={(data) => handleDrop(data.event, data.column)}
					onResize={(data) => handleResize(data.column, data.width)}
				/>
				<tbody>
					{#each filteredRows as row, i}
						<VLMTableRow
							{row}
							{visibleColumns}
							{cleanDatasetName}
							{stratificationColumns}
							rowIndex={i}
						/>
					{/each}
				</tbody>
			</table>
		</div>
	</div>
</div>