<script lang="ts">
	import type { VariableType } from '$lib/types';
	export let variables: VariableType[];
	export let selectedColumns: Set<string>;
	export let columnOrder: string[];
	export let onColumnToggle: (column: string, checked: boolean) => void;
	export let onReorderVariables: (newOrder: string[]) => void;

	// Preserve drag and drop functionality
	let draggedVariable: string | null = null;

	function handleDragStart(e: DragEvent, variable: string) {
		draggedVariable = variable;
		if (e.dataTransfer) {
			e.dataTransfer.effectAllowed = 'move';
			e.dataTransfer.setData('text/plain', variable);
		}
	}

	function handleDragOver(e: DragEvent) {
		e.preventDefault();
		if (e.dataTransfer) {
			e.dataTransfer.dropEffect = 'move';
		}
	}

	function handleDrop(e: DragEvent, targetVariable: string) {
		e.preventDefault();
		if (!draggedVariable || draggedVariable === targetVariable) return;

		const newOrder = [...columnOrder];
		const fromIndex = newOrder.indexOf(draggedVariable);
		const toIndex = newOrder.indexOf(targetVariable);

		newOrder.splice(fromIndex, 1);
		newOrder.splice(toIndex, 0, draggedVariable);

		onReorderVariables(newOrder);
		draggedVariable = null;
	}

	// Sort variables based on columnOrder
	$: sortedVariables = [...variables].sort((a, b) => {
		const aIndex = columnOrder.indexOf(a);
		const bIndex = columnOrder.indexOf(b);
		if (aIndex === -1) return 1;
		if (bIndex === -1) return -1;
		return aIndex - bIndex;
	});
</script>

<aside class="w-1/4 bg-white p-4 shadow-md">
	<h2 class="mb-4 text-xl font-bold">Variables</h2>
	<ul class="pl-5">
		{#each sortedVariables as variable}
			<li
				draggable="true"
				on:dragstart={(e) => handleDragStart(e, variable.name)}
				on:dragover={handleDragOver}
				on:drop={(e) => handleDrop(e, variable.name)}
				class="cursor-move py-1 hover:bg-gray-100"
			>
				<label class="flex items-center space-x-2">
					<input
						type="checkbox"
						name={variable.name}
						value={variable.name}
						checked={selectedColumns.has(variable.name)}
						on:change={(e) => onColumnToggle(variable.name, (e.target as HTMLInputElement).checked)}
					/>
					<span class="flex-grow">{variable.name}</span>
					<span class="text-sm text-gray-500">{variable.dtype}</span>
				</label>
			</li>
		{/each}
	</ul>
</aside>
