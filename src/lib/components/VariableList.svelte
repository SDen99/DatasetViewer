<script lang="ts">
	import { GripVertical } from 'lucide-svelte';
	import * as Checkbox from '$lib/components/ui/checkbox';
	import { Badge } from '$lib/components/ui/badge';
	import type { VariableType } from '$lib/types';

	export let variables: VariableType[];
	export let selectedColumns: Set<string>;
	export let columnOrder: string[];
	export let onColumnToggle: (column: string, checked: boolean) => void;
	export let onReorderVariables: (newOrder: string[]) => void;

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

	$: sortedVariables = [...variables].sort((a, b) => {
		const aIndex = columnOrder.indexOf(a.name);
		const bIndex = columnOrder.indexOf(b.name);
		if (aIndex === -1) return 1;
		if (bIndex === -1) return -1;
		return aIndex - bIndex;
	});
</script>

<div class="px-3 py-2">
	<div class="space-y-1">
		{#each sortedVariables as variable}
			<div
				draggable="true"
				on:dragstart={(e) => handleDragStart(e, variable.name)}
				on:dragover={handleDragOver}
				on:drop={(e) => handleDrop(e, variable.name)}
				class="group flex items-center gap-2 rounded-lg border border-transparent p-2 hover:border-border hover:bg-accent"
			>
				<GripVertical
					class="h-4 w-4 shrink-0 text-muted-foreground opacity-0 group-hover:opacity-100"
				/>
				<Checkbox.Root
					checked={selectedColumns.has(variable.name)}
					onCheckedChange={(checked) => onColumnToggle(variable.name, checked)}
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
