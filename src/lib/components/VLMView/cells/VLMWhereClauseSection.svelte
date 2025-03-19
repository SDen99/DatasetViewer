<script lang="ts">
	import VLMExpandableSection from '$lib/components/VLMView/cells/VLMExpandableSection.svelte';

	let { 
		whereClause,
		sectionId
	} = $props<{
		whereClause: {
			source: {
				variable: string;
			};
			comparator: string;
			checkValues: string[];
		};
		sectionId: string;
	}>();

	// Helper function to format comparators
	function formatComparator(comparator: string): string {
		switch (comparator) {
			case 'EQ':
				return '=';
			case 'NE':
				return '≠';
			case 'LT':
				return '<';
			case 'LE':
				return '≤';
			case 'GT':
				return '>';
			case 'GE':
				return '≥';
			case 'IN':
				return 'in';
			case 'NOTIN':
				return 'not in';
			default:
				return comparator;
		}
	}
</script>

<VLMExpandableSection title="Where Clause" {sectionId}>
	<div class="mb-1">
		<span class="mr-1 text-xs font-medium text-muted-foreground">Condition:</span>
		{whereClause.source.variable}
		{formatComparator(whereClause.comparator)}
		{whereClause.checkValues.join(', ')}
	</div>
</VLMExpandableSection>