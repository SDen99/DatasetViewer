<script lang="ts">
	import { ArrowUp, ArrowDown } from 'svelte-lucide';
	import type { SortConfig } from '$lib/types';

	let { column, sorts } = $props<{
		column: string;
		sorts: SortConfig[];
	}>();

	let sortConfig = $derived(sorts.find((s: SortConfig) => s.column === column));
	let sortIndex = $derived(sorts.findIndex((s: SortConfig) => s.column === column) + 1);

	let showUp = $derived(sortConfig?.direction === 'asc');
	let showDown = $derived(sortConfig?.direction === 'desc');
</script>

<div class="inline-flex items-center gap-4">
	<span class="text-sm font-medium text-muted-foreground">
		{column}
	</span>

	{#if sortConfig}
		<div class="ml-3 flex items-center gap-0.5">
			<span class="text-xs text-muted-foreground">{sortIndex}</span>
			{#if showUp}
				<ArrowUp class="h-4 w-4" />
			{:else if showDown}
				<ArrowDown class="h-4 w-4" />
			{/if}
		</div>
	{/if}
</div>
