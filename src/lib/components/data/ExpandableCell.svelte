<script lang="ts">
	let { content = '' } = $props<{ content: string }>();

	let isExpanded = $state(false);
	let shouldTruncate = $derived(content.length > 1000);
	let displayContent = $derived(
		isExpanded ? content : content.slice(0, 1000) + (shouldTruncate ? '...' : '')
	);
</script>

<div class="relative">
	<div class="whitespace-pre-wrap">
		{@html displayContent}
	</div>

	{#if shouldTruncate}
		<button
			class="mt-1 text-xs text-blue-500 hover:text-blue-700"
			on:click={() => (isExpanded = !isExpanded)}
		>
			{isExpanded ? 'Show Less' : 'Show More'}
		</button>
	{/if}
</div>
