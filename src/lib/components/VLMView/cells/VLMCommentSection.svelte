<script lang="ts">
	import VLMExpandableSection from '$lib/components/VLMView/cells/VLMExpandableSection.svelte';

	let { 
		comment,
		sectionId
	} = $props<{
		comment: {
			description: string;
			OID?: string;
		};
		sectionId: string;
	}>();
</script>

<VLMExpandableSection title="Comment" {sectionId}>
	<div class="text-sm leading-relaxed">
		{comment.description}
	</div>
</VLMExpandableSection>