<script lang="ts">
	import { GripVertical } from 'svelte-lucide';
	import * as Checkbox from '$lib/components/core/checkbox';
	import { Badge } from '$lib/components/core/badge';
	import { tableUIStore } from '$lib/core/stores/tableUIStore.svelte';
	import type { VariableType } from '$lib/core/types/types';

	interface Props {
		variables: VariableType[];
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

		const newOrder = [...tableUIStore.columnOrder];
		const fromIndex = newOrder.indexOf(draggedVariable);
		const toIndex = newOrder.indexOf(targetVariable);

		newOrder.splice(fromIndex, 1);
		newOrder.splice(toIndex, 0, draggedVariable);

		tableUIStore.updateColumnOrder(newOrder);
		draggedVariable = null;
	}

	let sortedVariables = $derived(
		[...variables].sort((a, b) => {
			const aIndex = tableUIStore.columnOrder.indexOf(a.name);
			const bIndex = tableUIStore.columnOrder.indexOf(b.name);
			if (aIndex === -1) return 1;
			if (bIndex === -1) return -1;
			return aIndex - bIndex;
		})
	);
</script>

<div class="max-h-[calc(100vh-14rem)] overflow-y-auto px-3 py-2">
	<div class="space-y-1">
		{#each sortedVariables as variable}
			<!-- svelte-ignore a11y_no_static_element_interactions -->
			<div
				draggable="true"
				ondragstart={(e) => handleDragStart(e, variable.name)}
				ondragover={handleDragOver}
				ondrop={(e) => handleDrop(e, variable.name)}
				class="group flex items-center gap-2 rounded-lg border border-transparent p-2 hover:border-border hover:bg-accent"
			>
				<GripVertical
					class="h-4 w-4 shrink-0 text-muted-foreground opacity-0 group-hover:opacity-100"
				/>
				<Checkbox.Root
					checked={tableUIStore.selectedColumns.has(variable.name)}
					onCheckedChange={(checked) => tableUIStore.updateColumnSelection(variable.name, checked)}
				/>
				<div class="flex flex-1 items-center justify-between">
					<span
						class="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
					>
						{variable.name}
					</span>
					<Badge variant="secondary" class="font-mono">{variable.dtype}</Badge>
				</div>
			</div>
		{/each}
	</div>
</div>
