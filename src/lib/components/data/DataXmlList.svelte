<script lang="ts">
	import * as AlertDialog from '$lib/components/core/alert-dialog/index.js';
	import { Database, FileText, Files, Trash2, Loader2, AlertCircle } from 'lucide-svelte';
	import * as Button from '$lib/components/core/button';
	import { Progress } from '$lib/components/core/progress';
	import { datasetStore } from '$lib/core/stores/datasetStore.svelte';
	import { normalizeDatasetId } from '$lib/core/utils/datasetUtils';
	import { storeCoordinator } from '$lib/core/stores/storeCoordinator.svelte';
	import type { ItemGroup } from '$lib/core/processors/defineXML/types';
	import type { ParsedDefineXML } from '$lib/core/processors/defineXML/types';
	import * as Tooltip from '$lib/components/core/tooltip';
	import DefineXMLBadges from '$lib/components/data/DefineXMLBadges.svelte';

	// Props to maintain compatibility with DefineXMLSidebar
	let { sdtmDefine = null, adamDefine = null } = $props<{
		sdtmDefine?: ParsedDefineXML | null;
		adamDefine?: ParsedDefineXML | null;
	}>();

	function getDatasetStateInfo(state: {
		hasData: boolean;
		hasMetadata: boolean;
		isLoading: boolean;
		error?: string;
	}) {
		if (state.isLoading) {
			return {
				type: 'loading' as const,
				tooltip: 'Loading Dataset',
				iconClass: 'text-muted-foreground animate-spin'
			};
		}

		if (state.error) {
			return {
				type: 'error' as const,
				tooltip: state.error,
				iconClass: 'text-destructive'
			};
		}

		if (state.hasData && state.hasMetadata) {
			return {
				type: 'both' as const,
				tooltip: 'Data + Metadata Available',
				iconClass: 'text-primary'
			};
		}

		if (state.hasData) {
			return {
				type: 'data' as const,
				tooltip: 'Data Only',
				iconClass: 'text-primary'
			};
		}

		return {
			type: 'metadata' as const,
			tooltip: 'Metadata Only',
			iconClass: 'text-muted-foreground'
		};
	}

	function getDatasetState(name: string) {
		const normalizedName = normalizeDatasetId(name);

		// Check metadata existence
		const metadata = getDatasetMetadata(normalizedName);
		console.log('Getting metadata for:', normalizedName, 'Found:', metadata);

		// Find actual dataset if it exists
		const dataset = Object.entries(datasetStore.datasets).find(
			([dataName]) => normalizeDatasetId(dataName) === normalizedName
		)?.[1];

		// Check if dataset has the required structure for data viewing
		const hasValidData = Boolean(
			dataset?.data &&
				dataset?.details?.columns &&
				Array.isArray(dataset.details.columns) &&
				dataset.details.columns.length > 0
		);

		// Check loading state and potential error
		const loadingDataset = Object.entries(datasetStore.loadingDatasets).find(
			([loadingName]) => normalizeDatasetId(loadingName) === normalizedName
		);
		const isLoading = Boolean(loadingDataset);
		const error = loadingDataset?.[1]?.status === 'error' ? loadingDataset[1].error : undefined;

		// Check metadata existence
		const hasMetadata = Boolean(getDatasetMetadata(normalizedName));

		return {
			hasData: hasValidData,
			isLoading,
			error,
			hasMetadata,
			dataset // Include the actual dataset reference
		};
	}
	// State
	let datasetToDelete = $state<string | null>(null);
	let dialogOpen = $state(false);

	// Get all datasets excluding Define.xml files
	let allDatasets = $derived.by(() => {
		const datasetSet = new Set<string>();

		// Add normalized names from actual data (excluding Define.xml)
		Object.entries(datasetStore.datasets).forEach(([name, dataset]) => {
			// Check if it's a Define.xml file
			const isDefineXml =
				dataset.data &&
				typeof dataset.data === 'object' &&
				'metaData' in dataset.data &&
				'itemGroups' in dataset.data;
			// Only add if it's not a Define.xml
			if (!isDefineXml) {
				datasetSet.add(normalizeDatasetId(name));
			}
		});

		// Add normalized names from loading state
		Object.keys(datasetStore.loadingDatasets).forEach((name) =>
			datasetSet.add(normalizeDatasetId(name))
		);

		// Add normalized names from SDTM metadata if available
		sdtmDefine?.itemGroups?.forEach((group) => {
			const name = group.SASDatasetName || group.Name || '';
			if (name) datasetSet.add(normalizeDatasetId(name));
		});

		// Add normalized names from ADaM metadata if available
		adamDefine?.itemGroups?.forEach((group) => {
			const name = group.SASDatasetName || group.Name || '';
			if (name) datasetSet.add(normalizeDatasetId(name));
		});

		// Return sorted normalized names
		return Array.from(datasetSet).sort();
	});

	// Helper function to get metadata for a dataset
	function getDatasetMetadata(name: string) {
		const normalizedName = normalizeDatasetId(name);

		// Get Define.xml data directly from the store
		const { SDTM, ADaM } = datasetStore.defineXmlDatasets;

		console.log('Looking for metadata:', {
			normalizedName,
			hasSDTM: Boolean(SDTM),
			hasADaM: Boolean(ADaM),
			SDTMGroups: SDTM?.itemGroups?.length,
			ADAMGroups: ADaM?.itemGroups?.length
		});

		const sdtmMetadata = SDTM?.itemGroups?.find(
			(g) => normalizeDatasetId(g.SASDatasetName || g.Name || '') === normalizedName
		);
		const adamMetadata = ADaM?.itemGroups?.find(
			(g) => normalizeDatasetId(g.SASDatasetName || g.Name || '') === normalizedName
		);

		return sdtmMetadata || adamMetadata;
	}
	// Helper function to check dataset states
	// Get loading progress for a dataset
	function getLoadingProgress(name: string) {
		const normalizedName = normalizeDatasetId(name);
		const loadingDataset = Object.entries(datasetStore.loadingDatasets).find(
			([loadingName]) => normalizeDatasetId(loadingName) === normalizedName
		);
		return loadingDataset?.[1]?.progress || 0;
	}

	function getStateIcon(state: {
		hasData: boolean;
		hasMetadata: boolean;
		isLoading: boolean;
		error?: string;
	}) {
		if (state.isLoading) return Loader2;
		if (state.error) return AlertCircle;
		if (state.hasData && state.hasMetadata) return Files;
		if (state.hasData) return Database;
		return FileText;
	}

	function getStateTooltip(state: {
		hasData: boolean;
		hasMetadata: boolean;
		isLoading: boolean;
		error?: string;
	}) {
		if (state.isLoading) return 'Loading Dataset';
		if (state.error) return state.error;
		if (state.hasData && state.hasMetadata) return 'Data + Metadata Available';
		if (state.hasData) return 'Data Only';
		return 'Metadata Only';
	}

	// Event handlers
	function handleConfirmDelete() {
		if (datasetToDelete) {
			// Get all dataset names that match the normalized version
			const datasetNames = Object.keys(datasetStore.datasets).filter(
				(name) => normalizeDatasetId(name) === normalizeDatasetId(datasetToDelete)
			);

			// Delete all matching datasets
			datasetNames.forEach((name) => datasetStore.deleteDataset(name));

			datasetToDelete = null;
			dialogOpen = false;
		}
	}

	function handleDeleteClick(datasetName: string) {
		datasetToDelete = datasetName;
		dialogOpen = true;
	}

	function handleCancelClick() {
		datasetToDelete = null;
		dialogOpen = false;
	}

	function handleDatasetClick(name: string) {
		console.log('Clicking dataset:', name);
		const state = getDatasetState(name);
		console.log('Dataset state:', state);
		console.log('Dataset content:', state.dataset);

		if (state.hasData && state.dataset) {
			console.log('Selecting dataset with name:', state.dataset.fileName);
			storeCoordinator.selectDataset(state.dataset.fileName);
		}
	}
</script>

<div class="flex flex-col">
	<div class="flex items-center justify-between px-3 pb-3 pt-2">
		<h2 class="text-lg tracking-tight">Define(s):</h2>
		<DefineXMLBadges />
	</div>

	<div class="px-3">
		{#if allDatasets.length > 0}
			<div class="space-y-2">
				{#each allDatasets as datasetName}
					{@const state = getDatasetState(datasetName)}
					{@const stateInfo = getDatasetStateInfo(state)}
					<div
						class="overflow-hidden rounded-lg border {datasetName === datasetStore.selectedDatasetId
							? 'border-primary'
							: 'border-border'}"
					>
						<div class="flex items-center justify-between p-3">
							<button
								type="button"
								class="flex-1 text-left {state.hasData
									? 'hover:text-primary'
									: 'cursor-not-allowed opacity-70'}"
								onclick={() => handleDatasetClick(datasetName)}
								disabled={state.isLoading || !state.hasData}
							>
								<div class="flex items-center gap-2">
									<Tooltip.Provider>
										<Tooltip.Root>
											<Tooltip.Trigger asChild>
												<span class="inline-block">
													{#if stateInfo.type === 'loading'}
														<Loader2 class="h-4 w-4 {stateInfo.iconClass}" />
													{:else if stateInfo.type === 'error'}
														<AlertCircle class="h-4 w-4 {stateInfo.iconClass}" />
													{:else if stateInfo.type === 'both'}
														<Files class="h-4 w-4 {stateInfo.iconClass}" />
													{:else if stateInfo.type === 'data'}
														<Database class="h-4 w-4 {stateInfo.iconClass}" />
													{:else}
														<FileText class="h-4 w-4 {stateInfo.iconClass}" />
													{/if}
												</span>
											</Tooltip.Trigger>
											<Tooltip.Content>
												<p>{stateInfo.tooltip}</p>
											</Tooltip.Content>
										</Tooltip.Root>
									</Tooltip.Provider>
									<span class="truncate font-medium">{datasetName}</span>
									<!-- Keep your existing badges here -->
								</div>
							</button>

							{#if state.hasData && !state.isLoading}
								<Button.Root
									variant="ghost"
									size="icon"
									class="h-8 w-8 text-muted-foreground hover:text-destructive"
									onclick={() => handleDeleteClick(datasetName)}
								>
									<Trash2 class="h-4 w-4" />
								</Button.Root>
							{/if}
						</div>

						{#if state.isLoading}
							<div class="px-3 pb-3">
								<Progress value={getLoadingProgress(datasetName)} />
							</div>
						{/if}
					</div>
				{/each}
			</div>
		{:else}
			<div class="flex h-[150px] items-center justify-center text-muted-foreground">
				<p>No datasets available</p>
			</div>
		{/if}
	</div>

	<AlertDialog.Root bind:open={dialogOpen}>
		<AlertDialog.Portal>
			<AlertDialog.Content>
				<AlertDialog.Header>
					<AlertDialog.Title>Delete Dataset</AlertDialog.Title>
					<AlertDialog.Description>
						Are you sure you want to delete {datasetToDelete}? This action cannot be undone.
					</AlertDialog.Description>
				</AlertDialog.Header>

				<AlertDialog.Footer>
					<AlertDialog.Cancel onclick={handleCancelClick}>Cancel</AlertDialog.Cancel>
					<AlertDialog.Action
						class="bg-destructive text-destructive-foreground hover:bg-destructive/90"
						onclick={handleConfirmDelete}
					>
						Delete
					</AlertDialog.Action>
				</AlertDialog.Footer>
			</AlertDialog.Content>
		</AlertDialog.Portal>
	</AlertDialog.Root>
</div>
