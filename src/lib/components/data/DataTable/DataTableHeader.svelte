<script lang="ts">
	import { TableHead, TableHeader, TableRow } from '$lib/components/core/table';
	import { tableUIStore } from '$lib/core/stores/tableUIStore.svelte';
	import { sortStore } from '$lib/core/stores/sortStore.svelte';
	import ColumnHeader from './ColumnHeader.svelte';
	import type { SortConfig } from '$lib/core/types/types';

	let { columns, sort, onSort, onColumnReorder, onColumnResize } = $props<{
		columns: string[];
		sort: SortConfig[];
		onSort: (column: string) => void;
		onColumnReorder: (from: string, to: string) => void;
		onColumnResize: (column: string, width: number) => void;
	}>();

	let draggedColumn = $state<string | null>(null);
	let dragOverColumn = $state<string | null>(null);

	const DEFAULT_COLUMN_WIDTH = 200;

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

		const newOrder = [...tableUIStore.columnOrder];
		const fromIndex = newOrder.indexOf(draggedColumn);
		const toIndex = newOrder.indexOf(targetColumn);

		newOrder.splice(fromIndex, 1);
		newOrder.splice(toIndex, 0, draggedColumn);

		tableUIStore.updateColumnOrder(newOrder);

		dragOverColumn = null;
		draggedColumn = null;
	}

	let getColumnStyle = $derived((column: string) => {
		const width = tableUIStore.columnWidths[column] || DEFAULT_COLUMN_WIDTH;
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
					onDragStart={(e) => handleDragStart(e, column)}
					onDragOver={(e) => handleDragOver(e, column)}
					onDrop={(e) => handleDrop(e, column)}
					onResize={(width) => onColumnResize(column, width)}
				/>
			</TableHead>
		{/each}
	</TableRow>
</TableHeader>
