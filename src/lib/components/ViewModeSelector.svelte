<script lang="ts">
	import * as Tabs from '$lib/components/core/tabs';
	import { uiStore } from '$lib/core/stores/UIStore.svelte';
	import { datasetStore } from '$lib/core/stores/datasetStore.svelte';

	let value = $derived(uiStore.uiState.viewMode);
	let dataset = $derived(datasetStore.datasets[datasetStore.selectedDatasetId ?? '']);
	let defineData = $derived(datasetStore.defineXmlDatasets);

	let availableModes = $derived(() => {
		const modes = new Set<'data' | 'metadata' | 'split'>();

		if (dataset?.data) {
			modes.add('data');
		}

		const hasMetadata =
			defineData.SDTM?.itemGroups?.some((g) => g.Name === dataset?.fileName) ||
			defineData.ADaM?.itemGroups?.some((g) => g.Name === dataset?.fileName);

		if (hasMetadata) {
			modes.add('metadata');
		}

		if (modes.size > 1) {
			modes.add('split');
		}

		return modes;
	});

	function onValueChange(newValue: string) {
		uiStore.setViewMode(newValue as 'data' | 'metadata' | 'split');
	}
</script>

<Tabs.Root {value} {onValueChange}>
	<Tabs.List>
		{#if availableModes().has('data')}
			<Tabs.Trigger value="data">Data</Tabs.Trigger>
		{/if}

		{#if availableModes().has('metadata')}
			<Tabs.Trigger value="metadata">Metadata</Tabs.Trigger>
		{/if}

		{#if availableModes().has('split')}
			<Tabs.Trigger value="split">Split View</Tabs.Trigger>
		{/if}
	</Tabs.List>
</Tabs.Root>
