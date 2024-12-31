<script lang="ts">
	import { GripVertical, ArrowUpDown, ArrowDown, ArrowUp } from 'svelte-lucide';
	import { dataTableStore } from '$lib/stores/dataTableStore.svelte';

	interface Props {
		variables: { name: string }[];
	}

	let { variables }: Props = $props();

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

		// Get current sort order
		const currentSort = [...dataTableStore.sort];
		const fromIndex = currentSort.findIndex((s) => s.column === draggedVariable);
		const toIndex = currentSort.findIndex((s) => s.column === targetVariable);

		if (fromIndex !== -1 && toIndex !== -1) {
			// Reorder the sort array
			const [removed] = currentSort.splice(fromIndex, 1);
			currentSort.splice(toIndex, 0, removed);
			dataTableStore.sort = currentSort;
		}

		draggedVariable = null;
	}

	function toggleSort(variable: string) {
		const currentSort = [...dataTableStore.sort];
		const existingIndex = currentSort.findIndex((s) => s.column === variable);

		if (existingIndex === -1) {
			// Add new sort
			currentSort.push({ column: variable, direction: 'asc' });
		} else {
			// Toggle direction or remove
			if (currentSort[existingIndex].direction === 'asc') {
				currentSort[existingIndex].direction = 'desc';
			} else {
				currentSort.splice(existingIndex, 1);
			}
		}

		dataTableStore.sort = currentSort;
	}

	function getSortIcon(variable: string) {
		const sortConfig = dataTableStore.sort.find((s) => s.column === variable);
		if (!sortConfig) {
			return 'ArrowUpDown';
		}
		return sortConfig.direction === 'asc' ? 'ArrowUp' : 'ArrowDown';
	}

	function getSortIndex(variable: string) {
		return dataTableStore.sort.findIndex((s) => s.column === variable) + 1;
	}
</script>

<div class="px-3 py-2">
	<div class="space-y-1">
		{#each [...variables].sort((a, b) => {
			const aIndex = getSortIndex(a.name) - 1;
			const bIndex = getSortIndex(b.name) - 1;
			if (aIndex === -1 && bIndex === -1) return 0;
			if (aIndex === -1) return 1;
			if (bIndex === -1) return -1;
			return aIndex - bIndex;
		}) as variable}
			<div
				role="listitem"
				draggable="true"
				ondragstart={(e) => handleDragStart(e, variable.name)}
				ondragover={handleDragOver}
				ondrop={(e) => handleDrop(e, variable.name)}
				class="group flex items-center gap-2 rounded-lg border border-transparent p-2 hover:border-border hover:bg-accent"
			>
				<GripVertical
					class="h-4 w-4 shrink-0 text-muted-foreground opacity-0 group-hover:opacity-100"
				/>
				<button class="flex flex-1 items-center" onclick={() => toggleSort(variable.name)}>
					<div class="flex min-w-[40px] items-center">
						{#if getSortIndex(variable.name)}
							<span class="text-xs text-muted-foreground">
								{getSortIndex(variable.name)}
							</span>
						{/if}
						{#if getSortIcon(variable.name) === 'ArrowsUpDown'}
							<ArrowUpDown class="h-4 w-4 text-muted-foreground" />
						{:else if getSortIcon(variable.name) === 'ArrowUp'}
							<ArrowUp class="h-4 w-4 text-muted-foreground" />
						{:else if getSortIcon(variable.name) === 'ArrowDown'}
							<ArrowDown class="h-4 w-4 text-muted-foreground" />
						{/if}
					</div>
					<span class="text-sm font-medium leading-none">
						{variable.name}
					</span>
				</button>
			</div>
		{/each}
	</div>
</div>
