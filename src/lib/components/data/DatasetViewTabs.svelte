<script lang="ts">
	import { Tabs } from 'bits-ui';
	import { datasetStore } from '$lib/core/stores/datasetStore.svelte';
	import DataTable from '$lib/components/data/DataTable/DataTable.svelte';
	import MetadataView from '$lib/components/metadata/MetadataView.svelte';
	import VLMViewOld from '$lib/components/data/VLMdataViewOld.svelte';
	import VLMView from '$lib/components/VLMView/VLMdataView.svelte';
	import { uiStore } from '$lib/core/stores/UIStore.svelte';
	
	type ViewType = 'data' | 'metadata' | 'VLM';
	
	// Use a single local state for active tab
	let activeTab = $state<ViewType>('data');
	
	// Simple reactive reading from stores - no complex effects needed
	$effect(() => {
		const storeViewMode = uiStore.uiState.viewMode as ViewType;
		const availableViews = Object.entries(datasetStore.availableViews)
			.filter(([_, isAvailable]) => isAvailable)
			.map(([viewName]) => viewName as ViewType);
			
		// Update active tab if the store value is valid for current dataset
		if (availableViews.includes(storeViewMode)) {
			activeTab = storeViewMode;
		} 
		// If current active tab is no longer valid, pick the first available
		else if (!availableViews.includes(activeTab) && availableViews.length > 0) {
			activeTab = availableViews[0];
			uiStore.setViewMode(activeTab);
		}
	});
	
	// Convert object of booleans to array of available view types
	const viewArray = $derived(
		Object.entries(datasetStore.availableViews)
			.filter(([_, isAvailable]) => isAvailable)
			.map(([viewName]) => viewName as ViewType)
	);
	
	// Get the current dataset
	const dataset = $derived(
		datasetStore.selectedDatasetId ? datasetStore.datasets[datasetStore.selectedDatasetId] : null
	);
	
	function handleTabChange(newMode: string) {
		if (newMode !== activeTab && viewArray.includes(newMode as ViewType)) {
			activeTab = newMode as ViewType;
			uiStore.setViewMode(newMode as ViewType);
		}
	}
	
	const triggerClass =
		'relative h-9 rounded-none border-b-2 border-b-transparent bg-transparent px-4 pb-3 pt-2 font-semibold text-muted-foreground transition-none hover:text-foreground data-[state=active]:border-b-primary data-[state=active]:text-foreground';
</script>

<div class="w-full h-full rounded-md border bg-card flex flex-col">
	<div class="p-2 text-xs text-muted-foreground">
		Debug: Views: {viewArray.join(', ')} | Active: {activeTab} | 
		SelectedId: {datasetStore.selectedDatasetId} | SelectedDomain: {datasetStore.selectedDomain} |
		Has Data: {Boolean(dataset?.data && Array.isArray(dataset.data) && dataset.data.length > 0)} |
		Define: {datasetStore.activeDefineInfo.type ?? 'none'}
	</div>

	<Tabs.Root value={activeTab} onValueChange={handleTabChange} class="flex flex-col flex-grow">
		<Tabs.List class="w-full border-b bg-muted/50 px-4 flex-none">
			{#if datasetStore.availableViews.data}
				<Tabs.Trigger value="data" class={triggerClass}>Dataset</Tabs.Trigger>
			{/if}
			
			{#if datasetStore.availableViews.metadata}
				<Tabs.Trigger value="metadata" class={triggerClass}>Metadata</Tabs.Trigger>
			{/if}
			
			{#if datasetStore.availableViews.VLM}
				<Tabs.Trigger value="VLM" class={triggerClass}>VLM</Tabs.Trigger>
				<!--Tabs.Trigger value="VLMOld" class={triggerClass}>VLMOld</Tabs.Trigger-->
			{/if}
		</Tabs.List>

		<!-- Make tab content scrollable and contained within the available space -->
		{#if datasetStore.availableViews.data}
			<Tabs.Content value="data" class="p-4 overflow-auto flex-grow">
				{#if dataset?.data}
					<DataTable data={dataset.data} />
				{:else}
					<div class="p-4 text-muted-foreground">
						<p>Dataset content not available</p>
					</div>
				{/if}
			</Tabs.Content>
		{/if}

		{#if datasetStore.availableViews.metadata}
			<Tabs.Content value="metadata" class="p-4 overflow-auto flex-grow h-[calc(100%-3rem)]">
				<MetadataView
					define={datasetStore.activeDefineInfo.define}
					defineType={datasetStore.activeDefineInfo.type}
					datasetName={datasetStore.selectedDomain || datasetStore.selectedDatasetId}
				/>
			</Tabs.Content>
		{/if}

		{#if datasetStore.availableViews.VLM}
			<Tabs.Content value="VLM" class="p-4 overflow-auto flex-grow h-[calc(100%-3rem)]">
				<VLMView
					define={datasetStore.activeDefineInfo.define}
					defineType={datasetStore.activeDefineInfo.type}
					datasetName={datasetStore.selectedDomain || datasetStore.selectedDatasetId}
				/>
			</Tabs.Content>
		{/if}

		{#if datasetStore.availableViews.VLM}
			<Tabs.Content value="VLMOld" class="p-4 overflow-auto flex-grow h-[calc(100%-3rem)]">
				<VLMViewOld
					define={datasetStore.activeDefineInfo.define}
					defineType={datasetStore.activeDefineInfo.type}
					datasetName={datasetStore.selectedDomain || datasetStore.selectedDatasetId}
				/>
			</Tabs.Content>
		{/if}

	</Tabs.Root>
</div>