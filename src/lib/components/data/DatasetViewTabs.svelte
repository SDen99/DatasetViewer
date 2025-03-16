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

	// State declarations
	let selectedId = $state('');
	let selectedDomain = $state('');
	let dataset = $state<any>(null);
	let defineData = $state<DefineXmlDatasets>({ SDTM: null, ADaM: null });
	let isLoading = $state(false);
	let activeTab = $state<ViewType>('data');
	let viewArray = $state<ViewType[]>(['data']);
	let lastUpdateId = $state(''); // Track the last update to prevent loops
	let dataForTable = $state<any[] | null>(null); // NEW: Specific state for table data

	interface DefineXmlDatasets {
		SDTM: ParsedDefineXML | null;
		ADaM: ParsedDefineXML | null;
	}

	let normalizedDatasetName = $derived.by(() => {
		const nameToNormalize = selectedDomain || selectedId;
		return nameToNormalize ? normalizeDatasetId(nameToNormalize) : '';
	});

	let hasSDTM = $derived.by(() => {
		if (!defineData?.SDTM?.ItemGroups?.length || !normalizedDatasetName) {
			return false;
		}

		const result = defineData.SDTM.ItemGroups.some((g: ItemGroup) => {
			const normalized = normalizeDatasetId(g.Name || g.SASDatasetName || '');
			const match = normalized === normalizedDatasetName;
			return match;
		});

		return result;
	});

	let hasADAM = $derived.by(() => {
		if (!defineData?.ADaM?.ItemGroups?.length || !normalizedDatasetName) {
			console.log('hasADAM check failed:', {
				hasADaMData: !!defineData?.ADaM,
				hasItemGroups: !!defineData?.ADaM?.ItemGroups,
				itemGroupsLength: defineData?.ADaM?.ItemGroups?.length,
				normalizedDatasetName
			});
			return false;
		}

		// Log all normalized names for comparison
		const allNormalizedNames = defineData.ADaM.ItemGroups.map((g) => {
			const name = g.Name || g.SASDatasetName || '';
			return {
				original: name,
				normalized: normalizeDatasetId(name)
			};
		});

		console.log('ADaM dataset names for comparison:', {
			looking_for: normalizedDatasetName,
			available: allNormalizedNames
		});

		const result = defineData.ADaM.ItemGroups.some((g: ItemGroup) => {
			const normalized = normalizeDatasetId(g.Name || g.SASDatasetName || '');
			const match = normalized === normalizedDatasetName;

			if (match) {
				console.log('Found ADaM match:', {
					original: g.Name || g.SASDatasetName,
					normalized,
					normalizedDatasetName
				});
			}

			return match;
		});

		console.log('hasADAM result:', result);
		return result;
	});

	let activeDefine = $derived.by(() => {
		const normalizedName = normalizedDatasetName;

		if (
			defineData.ADaM &&
			defineData.ADaM.ItemGroups?.some(
				(g) => normalizeDatasetId(g.Name || g.SASDatasetName || '') === normalizedName
			)
		) {
			return defineData.ADaM;
		}

		if (
			defineData.SDTM &&
			defineData.SDTM.ItemGroups?.some(
				(g) => normalizeDatasetId(g.Name || g.SASDatasetName || '') === normalizedName
			)
		) {
			return defineData.SDTM;
		}

		if (hasSDTM) return defineData.SDTM;
		if (hasADAM) return defineData.ADaM;

		return null;
	});

	let defineType = $derived.by(() => {
		if (activeDefine === defineData.SDTM) return 'SDTM';
		if (activeDefine === defineData.ADaM) return 'ADaM';
		return null;
	});

	let hasMetadata = $derived.by(() => {
		const result = hasSDTM || hasADAM;
		return result;
	});

	const triggerClass =
		'relative h-9 rounded-none border-b-2 border-b-transparent bg-transparent px-4 pb-3 pt-2 font-semibold text-muted-foreground transition-none hover:text-foreground data-[state=active]:border-b-primary data-[state=active]:text-foreground';

	// Helper to get the actual data to display

	function getDataForDisplay() {
  // Try to get data in order of preference:
  let dataToDisplay = null;
  
  // Log the current state for debugging
  console.log('getDataForDisplay - starting values:', {
    updateId: lastUpdateId,
    selectedId,
    selectedDomain,
    hasDataset: !!dataset,
    hasDatasetData: !!dataset?.data,
    isSasDataset: selectedId?.includes('sas7bdat') || false
  });
  
  // FIRST: Try direct data from SAS dataset
  if (selectedId?.includes('sas7bdat') && dataset?.data) {
    console.log('Using SAS dataset data directly');
    dataToDisplay = dataset.data;
  }
  // SECOND: If selected domain AND the ID is a define.xml file
  else if (selectedDomain && selectedId?.includes('define')) {
    // Get domain data by normalized domain name look-up
    const normalizedDomain = normalizeDatasetId(selectedDomain);
    console.log('Looking for normalized domain data:', normalizedDomain);
    
    // Explicitly check all datasets 
    for (const [key, value] of Object.entries(datasetStore.datasets)) {
      const normalizedKey = normalizeDatasetId(key);
      if (normalizedKey === normalizedDomain && value.data) {
        console.log('Found data by normalized domain name:', key);
        dataToDisplay = value.data;
        break;
      }
    }
    
    if (!dataToDisplay) {
      console.log('No data found for domain:', selectedDomain);
    }
  }
  // THIRD: Try direct domain data
  else if (selectedDomain && datasetStore.datasets[selectedDomain]?.data) {
    console.log('Found data directly for domain:', selectedDomain);
    dataToDisplay = datasetStore.datasets[selectedDomain].data;
  }
  // FOURTH: Fall back to current dataset
  else if (dataset?.data && Array.isArray(dataset.data)) {
    console.log('Using dataset.data as fallback');
    dataToDisplay = dataset.data;
  }
  
  // Ensure we have a valid array
  if (dataToDisplay) {
    if (Array.isArray(dataToDisplay) && dataToDisplay.length > 0) {
      console.log('Using valid array data for display, length:', dataToDisplay.length);
      return dataToDisplay;
    } else if (
      typeof dataToDisplay === 'object' && 
      dataToDisplay !== null && 
      'data' in dataToDisplay && 
      Array.isArray(dataToDisplay.data)
    ) {
      console.log('Found nested data array, length:', dataToDisplay.data.length);
      return dataToDisplay.data;
    }
  }
  
  console.log('No valid array data available for display');
  return null;
}

	// Special effect to update table data whenever selection changes
	$effect(() => {
		// Update table data whenever selection changes
		if (selectedId || selectedDomain) {
			// Get the data and create a completely new array reference to force reactivity
			const newData = getDataForDisplay();
			if (newData) {
				console.log('Updating dataForTable with new array reference, length:', newData.length);
				// Make a shallow copy to ensure reference changes
				dataForTable = [...newData];
			} else {
				dataForTable = null;
			}
		} else {
			dataForTable = null;
		}
	});

	// 1. Effect to update local state from store
	$effect(() => {
		const storeDatasetId = datasetStore.selectedDatasetId;
		const storeDomain = datasetStore.selectedDomain;
		
		// Create a unique identifier for this update to track changes
		const updateId = `${storeDatasetId || ''}:${storeDomain || ''}`;
		
		// Only process if this is a new update
		if (updateId !== lastUpdateId) {
			console.log('DatasetViewTabs: Processing store update', {
				updateId,
				lastUpdateId,
				storeDatasetId,
				storeDomain,
				hasDatasetById: storeDatasetId ? !!datasetStore.datasets[storeDatasetId] : false,
				currentDataset: !!dataset?.data
			});
			
			// Update tracking ID first to prevent re-entry
			lastUpdateId = updateId;
			
			// Update local state for IDs
			selectedId = storeDatasetId ?? '';
			selectedDomain = storeDomain ?? '';
			
			// Only update the dataset if it exists in the store by ID
			if (storeDatasetId && datasetStore.datasets[storeDatasetId]) {
				console.log('Setting dataset from store by ID:', storeDatasetId);
				// In Svelte 5, create a new object reference to trigger reactivity
				dataset = { ...datasetStore.datasets[storeDatasetId] };
			}
			// If ID is empty but domain has changed, don't clear the dataset as we might
			// need it for data lookup by normalized name
			else if (!storeDatasetId && storeDomain && storeDomain !== '') {
				console.log('Domain changed to:', storeDomain);
				// We'll try to find data for this domain in getDataForDisplay()
			}
			// Only clear dataset when both ID and domain are empty
			else if (!storeDatasetId && !storeDomain) {
				console.log('Clearing dataset - both ID and domain are empty');
				dataset = null;
			}
			
			// Update other state values regardless
			defineData = { ...datasetStore.defineXmlDatasets };
			isLoading = datasetStore.isLoading ?? false;
		}
	});

	// 2. Separate effect for calculating views based on state changes
	$effect(() => {
		// Only recalculate if we have a valid update ID
		if (lastUpdateId && (selectedId || selectedDomain)) {
			console.log('View calculation triggered by state change:', {
				selectedId,
				selectedDomain,
				hasDataset: !!dataset,
				hasData: !!dataForTable
			});
			
			// Calculate views without modifying the UI store
			calculateViewsOnly();
		}
	});

	// 3. Separate effect for syncing with UI store view mode
	$effect(() => {
		// Get the current UI store view mode
		const storeViewMode = uiStore.uiState.viewMode;

		// If the active tab doesn't match the store and is a valid option, update local state
		if (activeTab !== storeViewMode && viewArray.includes(storeViewMode as ViewType)) {
			activeTab = storeViewMode as ViewType;
		}

		// If the active tab is not valid but we have options, update the UI store
		// This is the only place we update the UI store
		if (!viewArray.includes(activeTab) && viewArray.length > 0) {
			// Use requestAnimationFrame to break the immediate reactivity chain
			requestAnimationFrame(() => {
				// Double-check that we still need to update
				if (!viewArray.includes(activeTab) && viewArray.length > 0) {
					untrack(() => {
						uiStore.setViewMode(viewArray[0]);
					});
				}
			});
		}
	});

	// Calculate views without side effects
	function calculateViewsOnly() {
		const newViews: ViewType[] = [];

		// Check for data presence using dataForTable for consistency
		const hasActualData = !!dataForTable;
		
		// Also check the dataset state for more metadata
		const datasetStateHasData = selectedDomain ? 
			datasetStore.getDatasetState(selectedDomain).hasData : false;
			
		// Log detailed debug info about what's happening with the data
		console.log('Dataset view calculation details:', {
			selectedId,
			selectedDomain,
			hasDatasetData: !!dataset?.data,
			datasetStateHasData,
			hasActualData,
			isSasDataset: selectedId?.includes('sas7bdat') || false
		});

		// Add data tab if we have data according to either check
		if (datasetStateHasData || hasActualData) {
			newViews.push('data');
		}

		if (hasMetadata) {
			newViews.push('metadata');

			// Check if this is a BDS dataset
			const isBDSDataset = checkIfBDSDataset();
			console.log('BDS dataset check:', isBDSDataset);

			if (isBDSDataset) {
				newViews.push('VLM');
			}
		}

		console.log('New view array:', newViews, 'Current:', viewArray);

		// If the views have changed, update the array
		if (JSON.stringify(newViews) !== JSON.stringify(viewArray)) {
			console.log('Updating view array to:', newViews);
			viewArray = [...newViews];
		}
	}

	function handleTabChange(newMode: string) {
		// Check if this is a valid mode and different from current
		if (newMode !== activeTab && viewArray.includes(newMode as ViewType)) {
			uiStore.setViewMode(newMode as ViewType);
		}
	}

	function checkIfBDSDataset(): boolean {
		if (!normalizedDatasetName) return false;

		if (defineData.ADaM?.ItemGroups) {
			const adamDataset = defineData.ADaM.ItemGroups.find(
				(g: ItemGroup) =>
					normalizeDatasetId(g.Name || g.SASDatasetName || '') === normalizedDatasetName
			);

			if (adamDataset) {
				const isBDS = adamDataset.Class === 'BASIC DATA STRUCTURE';
				return isBDS;
			}
		}

		// For SDTM datasets, we could add additional checks if needed
		return false;
	}
</script>

<div class="w-full rounded-md border bg-card">
	<div class="p-2 text-xs text-muted-foreground">
		Debug: Views [{viewArray.join(', ')}] | SelectedId: {selectedId} | SelectedDomain: {selectedDomain}
		| Normalized: {normalizedDatasetName} | Metadata: {hasMetadata ? 'Yes' : 'No'}
		| SDTM: {Boolean(defineData.SDTM)} | ADaM: {Boolean(defineData.ADaM)}
		| SDTM Groups: {defineData.SDTM?.ItemGroups?.length ?? 0}
		| ADaM Groups: {defineData.ADaM?.ItemGroups?.length ?? 0}
		| hasSDTM: {hasSDTM} | hasADAM: {hasADAM}
		| hasDataset: {!!dataset} | hasData: {!!dataForTable}
	</div>

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

			{#if viewArray.includes('data')}
			<Tabs.Content value="data" class="p-4">
			  {#key lastUpdateId}
				{#if getDataForDisplay()}
				  <div class="data-table-wrapper" data-table-id={lastUpdateId}>
					<DataTable data={getDataForDisplay()} />
				  </div>
				{:else}
				  <div class="p-4 text-muted-foreground">
					<p>Dataset content not available</p>
				  </div>
				{/if}
			  {/key}
			</Tabs.Content>
		  {/if}

			{#if viewArray.includes('metadata')}
				<Tabs.Content value="metadata" class="p-4">
					<MetadataView
						define={activeDefine}
						defineType={defineType as 'SDTM' | 'ADaM' | null}
						datasetName={selectedDomain || selectedId}
					/>
				</Tabs.Content>
			{/if}

			{#if viewArray.includes('VLM')}
				<Tabs.Content value="VLM" class="p-4">
					<VLMView
						define={activeDefine}
						defineType={defineType as 'SDTM' | 'ADaM' | null}
						datasetName={selectedDomain || selectedId}
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
					No data or metadata available for this dataset (Views: {viewArray.length})
				{/if}
			</p>
		</div>
	{/if}
</div>