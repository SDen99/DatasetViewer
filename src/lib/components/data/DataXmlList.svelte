<script lang="ts">
	import * as AlertDialog from '$lib/components/core/alert-dialog/index.js';
	import { Trash2 } from 'svelte-lucide';
	import * as Button from '$lib/components/core/button';
	import { Progress } from '$lib/components/core/progress';
	import { Badge } from '$lib/components/core/badge';
	import { datasetStore } from '$lib/core/stores/datasetStore.svelte';
	import { normalizeDatasetId } from '$lib/core/utils/datasetUtils';
	import { storeCoordinator } from '$lib/core/stores/storeCoordinator.svelte';
	import type { ItemGroup } from '$lib/core/processors/defineXML/types';
	import type { ParsedDefineXML } from '$lib/core/processors/defineXML/types';

	// Props to maintain compatibility with DefineXMLSidebar
	let { sdtmDefine = null, adamDefine = null } = $props<{
		sdtmDefine?: ParsedDefineXML | null;
		adamDefine?: ParsedDefineXML | null;
	}>();

	// State
	let datasetToDelete = $state<string | null>(null);
	let dialogOpen = $state(false);

	// Get all datasets from both data and metadata sources
	let allDatasets = $derived.by(() => {
		const datasetSet = new Set<string>();

		// Add normalized names from actual data
		Object.keys(datasetStore.datasets).forEach((name) => datasetSet.add(normalizeDatasetId(name)));

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
		const sdtmMetadata = sdtmDefine?.itemGroups?.find(
			(g) => normalizeDatasetId(g.SASDatasetName || g.Name || '') === normalizedName
		);
		const adamMetadata = adamDefine?.itemGroups?.find(
			(g) => normalizeDatasetId(g.SASDatasetName || g.Name || '') === normalizedName
		);
		return sdtmMetadata || adamMetadata;
	}

	// Helper function to check dataset states
	function getDatasetState(name: string) {
		const normalizedName = normalizeDatasetId(name);

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

		// Check loading state
		const isLoading = Object.keys(datasetStore.loadingDatasets).some(
			(loadingName) => normalizeDatasetId(loadingName) === normalizedName
		);

		// Check metadata existence
		const hasMetadata = Boolean(getDatasetMetadata(normalizedName));

		return {
			hasData: hasValidData,
			isLoading: Boolean(isLoading),
			hasMetadata: Boolean(hasMetadata),
			dataset // Include the actual dataset reference
		};
	}

	// Get loading progress for a dataset
	function getLoadingProgress(name: string) {
		const normalizedName = normalizeDatasetId(name);
		const loadingDataset = Object.entries(datasetStore.loadingDatasets).find(
			([loadingName]) => normalizeDatasetId(loadingName) === normalizedName
		);
		return loadingDataset?.[1]?.progress || 0;
	}

	// Event handlers (keeping original names from DatasetList)
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
		const state = getDatasetState(name);

		// Only allow selection if we have valid data that can be displayed
		if (state.hasData && state.dataset) {
			const originalName = state.dataset.fileName;
			storeCoordinator.selectDataset(originalName);
		}
	}
</script>

<div class="px-3 py-2">
	{#if allDatasets.length > 0}
		<div class="space-y-2">
			{#each allDatasets as datasetName}
				{@const state = getDatasetState(datasetName)}
				{@const metadata = getDatasetMetadata(datasetName)}
				<div
					class="overflow-hidden rounded-lg border {datasetName === datasetStore.selectedDatasetId
						? 'border-primary'
						: 'border-border'}"
				>
					<div class="flex flex-col gap-2">
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
									<span class="truncate font-medium">{datasetName}</span>
									{#if state.isLoading}
										<Badge variant="secondary">Loading</Badge>
									{/if}
									{#if !state.hasData && state.hasMetadata}
										<Badge variant="secondary">Metadata</Badge>
									{/if}
									{#if state.hasData && state.hasMetadata}
										<Badge variant="secondary">Data + Metadata</Badge>
									{/if}
									{#if metadata?.ItemRefs}
										<span class="text-sm text-muted-foreground">({metadata.ItemRefs.length})</span>
									{/if}
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
				</div>
			{/each}
		</div>
	{:else}
		<div class="flex h-[150px] items-center justify-center text-muted-foreground">
			<p>No datasets available</p>
		</div>
	{/if}

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
