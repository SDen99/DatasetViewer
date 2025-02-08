<script lang="ts">
	import DefineXMLBadges from '$lib/components/data/DefineXMLBadges.svelte';
	import DatasetCards from '$lib/components/DatasetCards.svelte';
</script>

<div class="flex flex-col">
	<div class="flex items-center justify-between px-3 pb-3 pt-2">
		<h2 class="text-lg tracking-tight">Define(s):</h2>
		<DefineXMLBadges />
	</div>

	<div class="px-3">
		<DatasetCards />
	</div>
</div>
