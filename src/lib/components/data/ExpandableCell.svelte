<script lang="ts">
	let { content } = $props<{ content: string }>();
	let expanded = $state(false);
	let truncatedContent = $derived(content.length > 100 ? content.slice(0, 100) + '...' : content);

	function toggleExpanded() {
		expanded = !expanded;
	}

	function handleKeyDown(event: KeyboardEvent) {
		if (event.key === 'Enter' || event.key === ' ') {
			toggleExpanded();
			event.preventDefault();
		}
	}
</script>

<div
	class="relative"
	role="button"
	tabindex="0"
	onclick={toggleExpanded}
	onkeydown={handleKeyDown}
	aria-expanded={expanded}
>
	<div>
		{#if expanded}
			{content}
		{:else}
			{truncatedContent}
		{/if}
	</div>
	{#if content.length > 100}
		<button
			type="button"
			class="mt-1 text-sm text-blue-500 hover:text-blue-700"
			onclick={(e) => {
				e.stopPropagation();
				toggleExpanded();
			}}
			aria-label={expanded ? 'Show less' : 'Show more'}
		>
			{expanded ? 'Show less' : 'Show more'}
		</button>
	{/if}
</div>
