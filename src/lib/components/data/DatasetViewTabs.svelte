<script lang="ts">
	import { Tabs } from 'bits-ui';
	import { datasetStore } from '$lib/core/stores/datasetStore.svelte';
	import DataTable from '$lib/components/data/DataTable/DataTable.svelte';
	import MetadataView from '$lib/components/metadata/MetadataView.svelte';
	import VLMView from '$lib/components/data/VLMdataView.svelte';
	import { normalizeDatasetId } from '$lib/core/utils/datasetUtils';
	import { uiStore } from '$lib/core/stores/UIStore.svelte';
	import type { ItemGroup } from '$lib/types';

	type ViewType = 'data' | 'metadata' | 'VLM';

	// State declarations
	let selectedId = $state('');
	let dataset = $state<any>(null);
	let defineData = $state({ SDTM: null, ADaM: null });
	let isLoading = $state(false);
	let activeTab = $state<ViewType>('data');
	let viewArray = $state<ViewType[]>([]);

	// Derived values for metadata checks
	let hasData = $derived(!!dataset?.data);
	let normalizedDatasetName = $derived(selectedId ? normalizeDatasetId(selectedId) : '');
	let hasSDTM = $derived(
		defineData?.SDTM?.ItemGroups?.some(
			(g: ItemGroup) => g.Name && normalizeDatasetId(g.Name || '') === normalizedDatasetName
		)
	);
	let hasADAM = $derived(
		defineData?.ADaM?.ItemGroups?.some(
			(g: ItemGroup) => g.Name && normalizeDatasetId(g.Name || '') === normalizedDatasetName
		)
	);
	let hasMetadata = $derived(hasSDTM || hasADAM);
	const triggerClass =
		'relative h-9 rounded-none border-b-2 border-b-transparent bg-transparent px-4 pb-3 pt-2 font-semibold text-muted-foreground transition-none hover:text-foreground data-[state=active]:border-b-primary data-[state=active]:text-foreground';

	// Update core state from stores
	$effect(() => {
		selectedId = datasetStore.selectedDatasetId ?? '';
		const originalId =
			datasetStore.getOriginalFilename(normalizeDatasetId(selectedId)) ?? selectedId;
		dataset = datasetStore.datasets[originalId];
		defineData = datasetStore.defineXmlDatasets;
		isLoading = datasetStore.isLoading ?? false;
		activeTab = uiStore.uiState.viewMode as ViewType;
	});

	// Update available views
	$effect(() => {
		const newViews: ViewType[] = [];
		if (hasData) newViews.push('data');
		if (hasMetadata) {
			newViews.push('metadata');
			newViews.push('VLM');
		}

		viewArray = newViews;

		// Update active tab if needed
		if (!isLoading && newViews.length > 0 && !newViews.includes(activeTab)) {
			uiStore.setViewMode(newViews[0]);
		}
	});

	function handleTabChange(newMode: string) {
		uiStore.setViewMode(newMode as ViewType);
	}
</script>

<div class="w-full rounded-md border bg-card">
	{#if !isLoading && viewArray.length > 0}
		<Tabs.Root value={activeTab} onValueChange={handleTabChange}>
			<Tabs.List class="w-full border-b bg-muted/50 px-4">
				{#if viewArray.includes('data')}
					<Tabs.Trigger value="data" class={triggerClass}>Dataset</Tabs.Trigger>
				{/if}

				{#if viewArray.includes('metadata')}
					<Tabs.Trigger value="metadata" class={triggerClass}>Metadata</Tabs.Trigger>
				{/if}

				{#if viewArray.includes('VLM')}
					<Tabs.Trigger value="VLM" class={triggerClass}>VLM</Tabs.Trigger>
				{/if}
			</Tabs.List>

			<!-- Add the Content sections -->
			{#if viewArray.includes('data') && dataset?.data}
				<Tabs.Content value="data" class="p-4">
					<DataTable data={dataset.data} />
				</Tabs.Content>
			{/if}

			{#if viewArray.includes('metadata')}
				<Tabs.Content value="metadata" class="p-4">
					<MetadataView
						sdtmDefine={defineData.SDTM ?? null}
						adamDefine={defineData.ADaM ?? null}
						datasetName={selectedId}
					/>
				</Tabs.Content>
			{/if}

			{#if viewArray.includes('VLM')}
				<Tabs.Content value="VLM" class="p-4">
					<VLMView
						sdtmDefine={defineData.SDTM ?? null}
						adamDefine={defineData.ADaM ?? null}
						datasetName={selectedId}
					/>
				</Tabs.Content>
			{/if}
		</Tabs.Root>
	{:else}
		<div class="flex h-[200px] items-center justify-center text-muted-foreground">
			<p>
				{#if isLoading}
					Loading...
				{:else}
					No data or metadata available for this dataset
				{/if}
			</p>
		</div>
	{/if}
</div>
