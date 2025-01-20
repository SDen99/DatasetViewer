<script lang="ts">
	import { Tabs } from 'bits-ui';
	import { datasetStore } from '$lib/core/stores/datasetStore.svelte';
	import DataTable from '$lib/components/data/DataTable/DataTable.svelte';
	import MetadataView from '$lib/components/data/MetadataView.svelte';
	import { normalizeDatasetId } from '$lib/core/utils/datasetUtils';

	let selectedId = $derived(datasetStore.selectedDatasetId);
	let dataset = $derived(datasetStore.datasets[selectedId ?? '']);
	let defineData = $derived(datasetStore.defineXmlDatasets);
	let activeTab = $state('data');

	type ViewType = 'data' | 'metadata';

	let views = $state(new Set<ViewType>());

	$effect(() => {
		const normalizedDatasetName = selectedId ? normalizeDatasetId(selectedId) : '';
		const newViews = new Set<ViewType>();

		// Check for data first
		if (dataset?.data) {
			newViews.add('data');
		}

		// Check for metadata
		const hasMetadata =
			defineData.SDTM?.itemGroups?.some(
				(g) => g.Name && normalizeDatasetId(g.Name) === normalizedDatasetName
			) ||
			defineData.ADaM?.itemGroups?.some(
				(g) => g.Name && normalizeDatasetId(g.Name) === normalizedDatasetName
			);

		if (hasMetadata) {
			newViews.add('metadata');
		}

		// If metadata is available but no data, make it the active tab
		if (!newViews.has('data') && newViews.has('metadata')) {
			activeTab = 'metadata';
		}

		views = newViews;
	});

	let availableViews = $derived([...views]);

	$effect(() => {
		console.log('DatasetViewTabs Debug:', {
			selectedId,
			normalizedName: selectedId ? normalizeDatasetId(selectedId) : '',
			dataset,
			defineData,
			availableViews,
			activeTab,
			hasMetadata:
				defineData.SDTM?.itemGroups?.some(
					(g) =>
						g.Name &&
						normalizeDatasetId(g.Name) === (selectedId ? normalizeDatasetId(selectedId) : '')
				) ||
				defineData.ADaM?.itemGroups?.some(
					(g) =>
						g.Name &&
						normalizeDatasetId(g.Name) === (selectedId ? normalizeDatasetId(selectedId) : '')
				)
		});
	});
</script>

<div class="w-full rounded-md border bg-card">
	{#if availableViews.length > 0}
		<Tabs.Root value={activeTab} onValueChange={(v) => (activeTab = v)} class="w-full">
			<Tabs.List class="w-full border-b bg-muted/50 px-4">
				{#if availableViews.includes('data')}
					<Tabs.Trigger
						value="data"
						class="relative h-9 rounded-none border-b-2 border-b-transparent bg-transparent px-4 pb-3 pt-2 font-semibold text-muted-foreground transition-none hover:text-foreground data-[state=active]:border-b-primary data-[state=active]:text-foreground"
					>
						Dataset
					</Tabs.Trigger>
				{/if}

				{#if availableViews.includes('metadata')}
					<Tabs.Trigger
						value="metadata"
						class="relative h-9 rounded-none border-b-2 border-b-transparent bg-transparent px-4 pb-3 pt-2 font-semibold text-muted-foreground transition-none hover:text-foreground data-[state=active]:border-b-primary data-[state=active]:text-foreground"
					>
						Metadata
					</Tabs.Trigger>
				{/if}
			</Tabs.List>

			{#if availableViews.includes('data') && dataset?.data}
				<Tabs.Content value="data" class="p-4">
					<DataTable data={dataset.data} />
				</Tabs.Content>
			{/if}

			{#if availableViews.includes('metadata')}
				<Tabs.Content value="metadata" class="p-4">
					<MetadataView
						sdtmDefine={defineData.SDTM ?? null}
						adamDefine={defineData.ADaM ?? null}
						datasetName={selectedId ?? ''}
					/>
				</Tabs.Content>
			{/if}
		</Tabs.Root>
	{:else}
		<div class="flex h-[200px] items-center justify-center text-muted-foreground">
			<p>No data or metadata available for this dataset</p>
		</div>
	{/if}
</div>
