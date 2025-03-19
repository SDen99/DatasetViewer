<script lang="ts">
	import VLMExpandableSection from '$lib/components/VLMView/cells/VLMExpandableSection.svelte';

	let { 
		origin,
		sectionId
	} = $props<{
		origin: {
			type?: string;
			source?: string;
			description?: string;
			translatedText?: string;
		};
		sectionId: string;
	}>();
</script>

<VLMExpandableSection title="Origin" {sectionId}>
	{#if origin.type}
		<div class="mb-1">
			<span class="mr-1 text-xs font-medium text-muted-foreground">Type:</span>
			{origin.type}
		</div>
	{/if}

	{#if origin.source}
		<div class="mb-1">
			<span class="mr-1 text-xs font-medium text-muted-foreground">Source:</span>
			{origin.source}
		</div>
	{/if}

	{#if origin.description}
		<div class="mb-1">
			<span class="mr-1 text-xs font-medium text-muted-foreground">Description:</span>
			{origin.description}
		</div>
	{/if}

	{#if origin.translatedText}
		<div class="mb-1">
			<span class="mr-1 text-xs font-medium text-muted-foreground">TranslatedText:</span>
			{origin.translatedText}
		</div>
	{/if}
</VLMExpandableSection>