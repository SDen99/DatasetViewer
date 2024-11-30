<script lang="ts">
	export let data: any[];
	export let selectedColumns: Set<string>;
	export let columnOrder: string[];
	export let onReorderColumns: (newOrder: string[]) => void;

	// Preserve drag and drop functionality
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

	// Use a reactive statement to derive visible columns
	$: visibleColumns = columnOrder.filter((col) => selectedColumns.has(col));

	// Track the actual column data separately
	$: tableData = data.map((row) => {
		const visibleData: Record<string, any> = {};
		visibleColumns.forEach((col) => {
			visibleData[col] = row[col];
		});
		return visibleData;
	});
</script>

<table class="min-w-full bg-white">
	<thead>
		<tr>
			{#each visibleColumns as column}
				<th
					draggable="true"
					on:dragstart={(e) => handleDragStart(e, column)}
					on:dragover={handleDragOver}
					on:drop={(e) => handleDrop(e, column)}
					class="cursor-move border-b border-gray-200 bg-gray-100 px-4 py-2 text-left text-sm font-semibold text-gray-700 hover:bg-gray-200"
				>
					{column}
				</th>
			{/each}
		</tr>
	</thead>
	<tbody>
		{#each tableData.slice(0, 10) as row}
			<tr>
				{#each visibleColumns as column}
					<td class="border-b border-gray-200 px-4 py-2 text-sm text-gray-700">
						{row[column]}
					</td>
				{/each}
			</tr>
		{/each}
	</tbody>
</table>
