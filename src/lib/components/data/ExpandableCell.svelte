<script lang="ts">
	let { content = '' } = $props<{ content: string }>();

	let isExpanded = $state(true); // Changed default to true so content is visible
	let shouldTruncate = $derived(content.length > 2000); // Increased threshold to 2000
	let displayContent = $derived(
		isExpanded ? content : content.slice(0, 1000) + (shouldTruncate ? '...' : '')
	);
</script>

<div class="relative">
	<div class="whitespace-pre-wrap">
		{@html displayContent}
	</div>

	{#if shouldTruncate}
		<div class="relative mt-1">
			<div
				class={!isExpanded
					? 'absolute bottom-0 left-0 h-8 w-full bg-gradient-to-t from-white to-transparent'
					: ''}
			></div>
			<button
				class="rounded-sm bg-primary/10 px-2 py-0.5 text-xs text-primary transition-colors hover:bg-primary/20"
				onclick={() => (isExpanded = !isExpanded)}
			>
				{isExpanded ? 'Show Less' : 'Show Full Content'}
			</button>
		</div>
	{/if}
</div>
