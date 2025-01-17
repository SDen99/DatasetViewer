<script lang="ts">
	import * as AlertDialog from '$lib/components/core/alert-dialog/index.js';
	import DatasetCard from './DatasetCard.svelte';
	import { datasetStore } from '$lib/core/stores/datasetStore.svelte';

	let datasetToDelete = $state<string | null>(null);
	let dialogOpen = $state(false);

	function handleConfirmDelete() {
		if (datasetToDelete) {
			datasetStore.deleteDataset(datasetToDelete);
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

	let allDatasetEntries = $derived([
		...Object.keys(datasetStore.datasets),
		...Object.keys(datasetStore.loadingDatasets)
	]);
</script>

<div class="px-3 py-2">
	{#if allDatasetEntries.length > 0}
		<div class="space-y-2">
			{#each allDatasetEntries as datasetName}
				<DatasetCard
					name={datasetName}
					isSelected={datasetName === datasetStore.selectedDatasetId}
					isLoading={Boolean(datasetStore.loadingDatasets[datasetName])}
					loadingProgress={datasetStore.loadingDatasets[datasetName]?.progress}
					showDelete={true}
					onDelete={handleDeleteClick}
				/>
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
