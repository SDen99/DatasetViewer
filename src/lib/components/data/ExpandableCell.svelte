<script lang="ts">
	import { Button } from '$lib/components/core/button';

	let { content, maxHeight = '200px' } = $props<{
		content: string;
		maxHeight?: string;
	}>();

	let isExpanded = $state(false);
	let cellRef: HTMLDivElement;
	let hasOverflow = $state(false);

	function toggleExpanded() {
		isExpanded = !isExpanded;
	}

	$effect(() => {
		if (cellRef) {
			// Check if content overflows the container
			hasOverflow = cellRef.scrollHeight > cellRef.clientHeight;
		}
	});
</script>

<div class="relative">
	<div
		bind:this={cellRef}
		class="overflow-hidden transition-all duration-200"
		style:max-height={isExpanded ? 'none' : maxHeight}
	>
		{@html content}
	</div>

	{#if hasOverflow}
		<Button
			variant="ghost"
			size="sm"
			class="absolute bottom-0 right-0 h-6 bg-background/80 p-0 text-xs"
			onclick={toggleExpanded}
		>
			{isExpanded ? 'Show less' : 'Show more'}
		</Button>
	{/if}
</div>
