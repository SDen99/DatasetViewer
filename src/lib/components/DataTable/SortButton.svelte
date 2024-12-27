<script lang="ts">
	import { ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-svelte';

	let { column, sort, onSort } = $props<{
		column: string;
		sort: {
			column: string | null;
			direction: 'asc' | 'desc' | null;
		};
		onSort: () => void;
	}>();

	// Changed to use explicit components instead of dynamic selection
	let showUpDown = $derived(sort.column !== column);
	let showUp = $derived(sort.column === column && sort.direction === 'asc');
	let showDown = $derived(sort.column === column && sort.direction === 'desc');

	let iconOpacity = $derived(sort.column === column ? 'opacity-100' : 'opacity-50');
</script>

<button
	type="button"
	class="inline-flex items-center justify-between gap-2 rounded-sm px-2
		   py-1.5 transition-colors
		   hover:bg-muted/50 focus-visible:outline-none
		   focus-visible:ring-2 focus-visible:ring-primary
		   focus-visible:ring-offset-2"
	onclick={onSort}
	aria-label="Sort by {column}"
	aria-pressed={sort.column === column
		? sort.direction === 'asc'
			? 'ascending'
			: 'descending'
		: 'none'}
>
	<span class="text-sm font-medium text-muted-foreground">
		{column}
	</span>

	{#if showUpDown}
		<ArrowUpDown class="h-4 w-4 {iconOpacity}" />
	{:else if showUp}
		<ArrowUp class="h-4 w-4 {iconOpacity}" />
	{:else if showDown}
		<ArrowDown class="h-4 w-4 {iconOpacity}" />
	{/if}
</button>
