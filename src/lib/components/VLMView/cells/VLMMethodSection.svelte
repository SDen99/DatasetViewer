<script lang="ts">
	import VLMExpandableSection from '$lib/components/VLMView/cells/VLMExpandableSection.svelte';

	let { 
		method,
		sectionId
	} = $props<{
		method: {
			Type?: string;
			Description?: string;
		};
		sectionId: string;
	}>();
</script>

<VLMExpandableSection title="Method" {sectionId}>
	{#if method.Type}
		<div class="mb-1">
			<span class="mr-1 text-xs font-medium text-muted-foreground">Type:</span>
			{method.Type}
		</div>
	{/if}
	{#if method.Description}
		<div class="mb-1">
			<span class="mr-1 text-xs font-medium text-muted-foreground">Description:</span>
			{method.Description}
		</div>
	{/if}
</VLMExpandableSection>