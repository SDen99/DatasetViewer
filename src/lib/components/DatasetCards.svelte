<script lang="ts">
	import { datasetStore } from '$lib/core/stores/datasetStore.svelte';
	import { storeCoordinator } from '$lib/core/stores/storeCoordinator.svelte';
	import { DatasetService } from '$lib/core/services/datasetService';
	import DatasetCardItem from './DatasetCardItem.svelte';
	import DatasetDeleteDialog from './DatasetDeleteDialog.svelte';

	// Local state using Runes
	let dialogOpen = $state(false);
	let datasetToDelete = $state<string | null>(null);
	let isInitialized = $state(false);
	let isDeleting = $state(false);

	// Using derived Runes
	const datasets = $derived.by(() => {
		return isInitialized ? datasetStore.availableDatasets : [];
	});

	const selectedDatasetId = $derived.by(() => datasetStore.selectedDatasetId);

	// Initialize data
	$effect.root(() => {
		async function initializeData() {
			try {
				const datasetService = DatasetService.getInstance();
				await datasetService.initialize();
				const allDatasets = await datasetService.getAllDatasets();
				datasetStore.setDatasets(allDatasets);
				isInitialized = true;
			} catch (error) {
				console.error('Failed to initialize datasets:', error);
			}
		}

		initializeData();
	});

	function handleDeleteClick(name: string) {
		if (!isDeleting) {
			datasetToDelete = name;
			dialogOpen = true;
		}
	}

	async function handleConfirmDelete() {
		if (datasetToDelete && !isDeleting) {
			try {
				isDeleting = true;
				await datasetStore.deleteDataset(datasetToDelete);

				// Small delay to ensure IndexedDB operation completes
				await new Promise((resolve) => setTimeout(resolve, 100));

				// Clear local state
				datasetToDelete = null;
				dialogOpen = false;
			} catch (error) {
				console.error('Error during deletion:', error);
			} finally {
				isDeleting = false;
			}
		}
	}

	function handleCancelDelete() {
		if (!isDeleting) {
			datasetToDelete = null;
			dialogOpen = false;
		}
	}

	function handleDatasetClick(name: string) {
		if (!isDeleting) {
			const state = datasetStore.getDatasetState(name);
			if (state.hasData || state.hasMetadata) {
				storeCoordinator.selectDataset(name);
			}
		}
	}

	$effect.root(() => {
		$effect(() => {
			console.log('State Debug:', {
				isInitialized,
				isDeleting,
				datasets: datasets.length,
				hasDatasetToDelete: Boolean(datasetToDelete)
			});
		});
	});
</script>

<div class="space-y-2">
	{#if datasets.length > 0}
		{#each datasets as name}
			<DatasetCardItem
				{name}
				state={datasetStore.getDatasetState(name)}
				isSelected={name === selectedDatasetId}
				loadingProgress={datasetStore.getDatasetState(name).loadingProgress}
				onDelete={() => handleDeleteClick(name)}
				onClick={() => handleDatasetClick(name)}
			/>
		{/each}
	{:else}
		<div class="flex h-[150px] items-center justify-center text-muted-foreground">
			<p>No datasets available</p>
		</div>
	{/if}
</div>

<DatasetDeleteDialog
	open={dialogOpen}
	datasetName={datasetToDelete}
	onConfirm={handleConfirmDelete}
	onCancel={handleCancelDelete}
/>
