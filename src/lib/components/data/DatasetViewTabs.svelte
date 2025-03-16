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

	// Break the update into separate effects to avoid circular dependencies

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
				defineData: {
					hasSDTM: !!datasetStore.defineXmlDatasets.SDTM,
					hasADaM: !!datasetStore.defineXmlDatasets.ADaM,
					SDTMGroups: datasetStore.defineXmlDatasets.SDTM?.ItemGroups?.length,
					ADaMGroups: datasetStore.defineXmlDatasets.ADaM?.ItemGroups?.length
				}
			});

			// Update tracking ID first to prevent re-entry
			lastUpdateId = updateId;

			// Update local state
			selectedId = storeDatasetId ?? '';
			selectedDomain = storeDomain ?? '';

			// Get dataset
			if (storeDatasetId) {
				dataset = datasetStore.datasets[storeDatasetId] || null;

				if (dataset) {
					console.log('Dataset retrieved:', {
						id: storeDatasetId,
						isDefineXML:
							dataset.data && typeof dataset.data === 'object' && 'MetaData' in dataset.data,
						hasData: !!dataset.data,
						hasDetails: !!dataset.details
					});
				} else {
					console.log('No dataset found for ID:', storeDatasetId);
				}
			} else {
				dataset = null;
			}

			defineData = datasetStore.defineXmlDatasets;
			isLoading = datasetStore.isLoading ?? false;
		}
	});

	// 2. Separate effect for calculating views
	$effect(() => {
		// Only recalculate if we have valid data
		if (lastUpdateId) {
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

		if (typeof dataset?.data[0] === 'object') {
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
