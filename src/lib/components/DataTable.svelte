<script lang="ts">
	export let data: any[];
	export let selectedColumns: Set<string>;
	export let columnOrder: string[];
	export let onReorderColumns: (newOrder: string[]) => void;

	let draggedColumn: string | null = null;

	function handleDragStart(e: DragEvent, column: string) {
		draggedColumn = column;
		if (e.dataTransfer) {
			e.dataTransfer.effectAllowed = 'move';
			e.dataTransfer.setData('text/plain', column);
		}
	}

	function handleDragOver(e: DragEvent) {
		e.preventDefault();
		if (e.dataTransfer) {
			e.dataTransfer.dropEffect = 'move';
		}
	}

	function handleDrop(e: DragEvent, targetColumn: string) {
		e.preventDefault();
		if (!draggedColumn || draggedColumn === targetColumn) return;

		const newOrder = [...columnOrder];
		const fromIndex = newOrder.indexOf(draggedColumn);
		const toIndex = newOrder.indexOf(targetColumn);

		newOrder.splice(fromIndex, 1);
		newOrder.splice(toIndex, 0, draggedColumn);

		onReorderColumns(newOrder);
		draggedColumn = null;
	}

	function isColumnSelected(column: string): boolean {
		return selectedColumns.has(column);
	}
</script>

<table class="min-w-full bg-white">
	<thead>
		<tr>
			{#each columnOrder as key}
				{#if isColumnSelected(key)}
					<th
						draggable="true"
						on:dragstart={(e) => handleDragStart(e, key)}
						on:dragover={handleDragOver}
						on:drop={(e) => handleDrop(e, key)}
						class="cursor-move border-b border-gray-200 bg-gray-100 px-4 py-2 text-left text-sm font-semibold text-gray-700 hover:bg-gray-200"
					>
						{key}
					</th>
				{/if}
			{/each}
		</tr>
	</thead>
	<tbody>
		{#each data.slice(0, 10) as row}
			<tr>
				{#each columnOrder as key}
					{#if isColumnSelected(key)}
						<td class="border-b border-gray-200 px-4 py-2 text-sm text-gray-700">{row[key]}</td>
					{/if}
				{/each}
			</tr>
		{/each}
	</tbody>
</table>
