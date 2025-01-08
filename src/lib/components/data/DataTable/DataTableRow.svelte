<script lang="ts">
	import { tableUIStore } from '$lib/core/stores/tableUIStore.svelte';
	import { TableRow, TableCell } from '$lib/components/core/table';

	let {
		row,
		columns,
		height,
		index = 0,
		isSelected = false,
		onRowClick
	} = $props<{
		row: Record<string, any>;
		columns: string[];
		height: number;
		index?: number;
		isSelected?: boolean;
		onRowClick?: (row: Record<string, any>) => void;
	}>();

	let getCellStyle = (column: string) => {
		const width = tableUIStore.columnWidths[column] || 200;
		return `width: ${width}px; min-width: ${width}px; max-width: ${width}px;`;
	};

	function formatCellContent(value: any, column: string): string {
		if (value == null) return '';

		if (value instanceof Date) {
			return value.toLocaleString();
		}

		if (typeof value === 'number') {
			return new Intl.NumberFormat().format(value);
		}

		if (typeof value === 'boolean') {
			return value ? 'Yes' : 'No';
		}

		return String(value);
	}

	function getCellClass(value: any, column: string): string {
		const classes = ['truncate'];

		if (typeof value === 'number') {
			classes.push('text-right');
		}

		if (value === null || value === '') {
			classes.push('text-gray-400 italic');
		}

		return classes.join(' ');
	}
</script>

<TableRow
	style="height: {height}px;"
	class="{index % 2 === 0 ? 'bg-white' : 'bg-gray-50'} 
             {isSelected ? 'bg-blue-50' : ''} 
             cursor-pointer transition-colors hover:bg-gray-100"
	onclick={() => onRowClick?.(row)}
	role="row"
	aria-selected={isSelected}
	tabindex={0}
>
	{#each columns as column}
		<TableCell
			style={getCellStyle(column)}
			class="border-b border-l border-gray-200 p-1 align-middle {getCellClass(row[column], column)}"
			title={formatCellContent(row[column], column)}
			role="cell"
		>
			<div class="flex h-full items-center">
				{#if row[column] === null || row[column] === ''}
					<span class="text-gray-400">—</span>
				{:else}
					{formatCellContent(row[column], column)}
				{/if}
			</div>
		</TableCell>
	{/each}
</TableRow>
