<script lang="ts">
	import { Tabs } from 'bits-ui';
	import { datasetStore } from '$lib/core/stores/datasetStore.svelte';
	import DataTable from '$lib/components/data/DataTable/DataTable.svelte';
	import MetadataView from '$lib/components/metadata/MetadataView.svelte';
	import VLMView from '$lib/components/data/VLMdataView.svelte';
	import { normalizeDatasetId } from '$lib/core/utils/datasetUtils';
	import { uiStore } from '$lib/core/stores/UIStore.svelte';
	import { untrack } from 'svelte';
	import type { ParsedDefineXML, ItemGroup } from '$lib/types/define-xml';
	
	type ViewType = 'data' | 'metadata' | 'VLM';
	
	// Simple state declarations
	let selectedId = $state('');
	let selectedDomain = $state('');
	let dataset = $state<any>(null);
	let viewArray = $state<ViewType[]>(['data']);
	let activeTab = $state<ViewType>('data');
	let lastUpdateId = $state(''); // Track the last update to prevent loops
	
	// Break the effect into smaller pieces to avoid loops
	$effect(() => {
	  // Create a unique identifier for this state
	  const currentUpdateId = `${datasetStore.selectedDatasetId || ''}:${datasetStore.selectedDomain || ''}`;
	  
	  // Only process if it's a new state
	  if (currentUpdateId !== lastUpdateId) {
		// Update tracking ID first to prevent re-entry
		lastUpdateId = currentUpdateId;
		
		// Update local state - use untrack to avoid reactivity loops
		untrack(() => {
		  selectedId = datasetStore.selectedDatasetId || '';
		  selectedDomain = datasetStore.selectedDomain || '';
		  
		  if (selectedId) {
			dataset = datasetStore.datasets[selectedId] || null;
		  } else {
			dataset = null;
		  }
		});
	  }
	});
	
	// Separate effect for view calculation
	$effect(() => {
	  // Only recalculate if we have a valid last update
	  if (lastUpdateId) {
		untrack(() => {
		  // Calculate available views
		  const calculatedViews = calculateViews();
		  
		  // Only update viewArray if it has changed to avoid loops
		  if (JSON.stringify(calculatedViews) !== JSON.stringify(viewArray)) {
			viewArray = calculatedViews;
		  }
		});
	  }
	});
	
	// Separate effect for active tab updates
	$effect(() => {
	  const storeViewMode = uiStore.uiState.viewMode as ViewType;
	  
	  // Only change if the viewMode is valid and different
	  if (viewArray.includes(storeViewMode) && activeTab !== storeViewMode) {
		activeTab = storeViewMode;
	  } 
	  // If current active tab is no longer valid, pick the first available
	  else if (!viewArray.includes(activeTab) && viewArray.length > 0 && activeTab !== viewArray[0]) {
		activeTab = viewArray[0];
		
		// Use untrack to avoid loops when updating the store
		untrack(() => {
		  uiStore.setViewMode(activeTab);
		});
	  }
	});
	
	function calculateViews() {
	  const views: ViewType[] = [];
	  
	  // Add data view if we have data
	  if (dataset?.data && Array.isArray(dataset.data) && dataset.data.length > 0) {
		views.push('data');
	  }
	  
	  // Basic check for metadata
	  const normalizedName = normalizeDatasetId(selectedDomain || selectedId);
	  const hasMetadata = checkForMetadata(normalizedName);
	  
	  if (hasMetadata) {
		views.push('metadata');
		
		// Check for VLM
		const isBDS = checkIfBDSDataset(normalizedName);
		if (isBDS) {
		  views.push('VLM');
		}
	  }
	  
	  // If we don't have any views, at least show the data tab
	  if (views.length === 0) {
		views.push('data');
	  }
	  
	  return views;
	}
	
	function checkForMetadata(normalizedName: string) {
	  if (!normalizedName) return false;
	  
	  // Check for metadata in SDTM
	  const hasSDTMMetadata = datasetStore.defineXmlDatasets.SDTM?.ItemGroups?.some(
		g => normalizeDatasetId(g.Name || g.SASDatasetName || '') === normalizedName
	  );
	  
	  // Check for metadata in ADaM
	  const hasADaMMetadata = datasetStore.defineXmlDatasets.ADaM?.ItemGroups?.some(
		g => normalizeDatasetId(g.Name || g.SASDatasetName || '') === normalizedName
	  );
	  
	  return Boolean(hasSDTMMetadata || hasADaMMetadata);
	}
	
	function checkIfBDSDataset(normalizedName: string): boolean {
	  if (!normalizedName) return false;
	  
	  if (datasetStore.defineXmlDatasets.ADaM?.ItemGroups) {
		const adamDataset = datasetStore.defineXmlDatasets.ADaM.ItemGroups.find(
		  g => normalizeDatasetId(g.Name || g.SASDatasetName || '') === normalizedName
		);
		
		if (adamDataset) {
		  return adamDataset.Class === 'BASIC DATA STRUCTURE';
		}
	  }
	  
	  return false;
	}
	
	function getActiveDefine() {
	  if (!selectedId) return { define: null, type: null };
	  
	  const normalizedName = selectedDomain 
		? normalizeDatasetId(selectedDomain) 
		: normalizeDatasetId(selectedId);
	  
	  // Check ADaM first
	  if (datasetStore.defineXmlDatasets.ADaM?.ItemGroups) {
		const hasMatch = datasetStore.defineXmlDatasets.ADaM.ItemGroups.some(
		  g => normalizeDatasetId(g.Name || g.SASDatasetName || '') === normalizedName
		);
		
		if (hasMatch) {
		  return { 
			define: datasetStore.defineXmlDatasets.ADaM, 
			type: 'ADaM' as 'SDTM' | 'ADaM' | null
		  };
		}
	  }
	  
	  // Then check SDTM
	  if (datasetStore.defineXmlDatasets.SDTM?.ItemGroups) {
		const hasMatch = datasetStore.defineXmlDatasets.SDTM.ItemGroups.some(
		  g => normalizeDatasetId(g.Name || g.SASDatasetName || '') === normalizedName
		);
		
		if (hasMatch) {
		  return { 
			define: datasetStore.defineXmlDatasets.SDTM, 
			type: 'SDTM' as 'SDTM' | 'ADaM' | null
		  };
		}
	  }
	  
	  return { define: null, type: null };
	}
	
	function handleTabChange(newMode: string) {
	  if (newMode !== activeTab && viewArray.includes(newMode as ViewType)) {
		activeTab = newMode as ViewType;
		
		// Update store but break reactivity loop
		untrack(() => {
		  uiStore.setViewMode(newMode as ViewType);
		});
	  }
	}
	
	const triggerClass =
	  'relative h-9 rounded-none border-b-2 border-b-transparent bg-transparent px-4 pb-3 pt-2 font-semibold text-muted-foreground transition-none hover:text-foreground data-[state=active]:border-b-primary data-[state=active]:text-foreground';
  </script>
  
  <div class="w-full rounded-md border bg-card">
	<div class="p-2 text-xs text-muted-foreground">
	  Debug: Views: {viewArray.join(', ')} | SelectedId: {selectedId} | SelectedDomain: {selectedDomain}
	</div>
  
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
  
	  {#if viewArray.includes('data')}
		<Tabs.Content value="data" class="p-4">
		  {#if dataset?.data}
			<DataTable data={dataset.data} />
		  {:else}
			<div class="p-4 text-muted-foreground">
			  <p>Dataset content not available</p>
			</div>
		  {/if}
		</Tabs.Content>
	  {/if}
  
	  {#if viewArray.includes('metadata')}
		<Tabs.Content value="metadata" class="p-4">
		  <MetadataView
			define={getActiveDefine().define}
			defineType={getActiveDefine().type}
			datasetName={selectedDomain || selectedId}
		  />
		</Tabs.Content>
	  {/if}
  
	  {#if viewArray.includes('VLM')}
		<Tabs.Content value="VLM" class="p-4">
		  <VLMView
			define={getActiveDefine().define}
			defineType={getActiveDefine().type}
			datasetName={selectedDomain || selectedId}
		  />
		</Tabs.Content>
	  {/if}
	</Tabs.Root>
  </div>