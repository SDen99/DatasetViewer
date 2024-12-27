<script lang="ts">
	import { TableHead, TableHeader, TableRow } from '$lib/components/ui/table';
	import { dataTableStore } from '$lib/stores/dataTableStore.svelte';
	import ColumnHeader from './ColumnHeader.svelte';

	let { columns, sort, onSort, onColumnResize } = $props<{
		columns: string[];
		sort: { column: string | null; direction: 'asc' | 'desc' | null };
		onSort: (column: string) => void;
		onColumnReorder: (from: string, to: string) => void;
		onColumnResize: (column: string, width: number) => void;
	}>();

	let draggedColumn = $state<string | null>(null);
	let dragOverColumn = $state<string | null>(null);

	const DEFAULT_COLUMN_WIDTH = 200;

	// Drag and drop handlers...
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

		// Get the current order
		const newOrder = [...dataTableStore.columnOrder];

		// Find positions
		const fromIndex = newOrder.indexOf(draggedColumn);
		const toIndex = newOrder.indexOf(targetColumn);

		// Remove dragged item and insert at new position
		newOrder.splice(fromIndex, 1);
		newOrder.splice(toIndex, 0, draggedColumn);

		// Update store with new order
		dataTableStore.updateColumnOrder(newOrder);

		dragOverColumn = null;
		draggedColumn = null;
	}

	let getColumnStyle = $derived((column: string) => {
		const width = dataTableStore.columnWidths[column] || DEFAULT_COLUMN_WIDTH;
		return `width: ${width}px; min-width: ${width}px; max-width: ${width}px;`;
	});
</script>

<TableHeader>
	<TableRow>
		{#each columns as column}
			<TableHead
				class="relative {dragOverColumn === column ? 'border-l-2 border-primary' : ''}"
				style={getColumnStyle(column)}
			>
				<ColumnHeader
					{column}
					{sort}
					onSort={() => onSort(column)}
					onDragStart={(e) => handleDragStart(e, column)}
					onDragOver={(e) => handleDragOver(e, column)}
					onDrop={(e) => handleDrop(e, column)}
					onResize={(width) => onColumnResize(column, width)}
				/>
			</TableHead>
		{/each}
	</TableRow>
</TableHeader>
