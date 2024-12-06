<script lang="ts">
	import { Trash2 } from 'lucide-svelte';
	import * as AlertDialog from '$lib/components/ui/alert-dialog';
	import { Progress } from '$lib/components/ui/progress';
	import type { DatasetLoadingState } from '../types';

	export let datasets: Record<string, any>;
	export let loadingDatasets: Record<string, DatasetLoadingState>;
	export let selectedDataset: string | null;
	export let onSelectDataset: (dataset: string) => void;
	export let onDeleteDataset: (dataset: string) => void;

	$: allDatasetEntries = [...Object.keys(datasets), ...Object.keys(loadingDatasets)];

	let datasetToDelete: string | null = null;
	let dialogOpen = false;

	function handleConfirmDelete(event: CustomEvent) {
		console.log('Confirm delete pressed, dataset:', datasetToDelete);
		if (datasetToDelete) {
			console.log('Calling onDeleteDataset with:', datasetToDelete);
			onDeleteDataset(datasetToDelete);
			datasetToDelete = null;
			dialogOpen = false;
		}
	}

	function handleDeleteClick(datasetName: string) {
		console.log('Trash icon clicked for:', datasetName);
		datasetToDelete = datasetName;
		dialogOpen = true;
		console.log('datasetToDelete set to:', datasetToDelete);
	}

	function handleCancelClick() {
		console.log('Cancel clicked, clearing datasetToDelete');
		datasetToDelete = null;
		dialogOpen = false;
	}

	// Debug reactive statement to monitor state changes
	$: {
		if (datasetToDelete !== null) {
			console.log('Dialog state:', { datasetToDelete, dialogOpen });
		}
	}
</script>

<aside class="w-1/4 bg-white p-4 shadow-md">
	<h2 class="mb-4 text-xl font-bold">Datasets</h2>
	{#if allDatasetEntries.length > 0}
		<ul>
			{#each allDatasetEntries as datasetName}
				<li class="flex flex-col gap-2 pl-2">
					<div class="flex items-center justify-between">
						<button
							type="button"
							class="flex-1 cursor-pointer rounded px-2 py-1 text-left text-gray-700 hover:bg-gray-100
								   {datasetName === selectedDataset ? 'bg-red-500 text-white hover:bg-red-600' : ''}"
							on:click={() => onSelectDataset(datasetName)}
							disabled={loadingDatasets[datasetName]}
						>
							{datasetName}
						</button>

						{#if !loadingDatasets[datasetName]}
							<AlertDialog.Root bind:open={dialogOpen}>
								<AlertDialog.Trigger asChild>
									<button
										class="ml-2 h-8 w-8 rounded-full p-1 text-red-500 hover:bg-red-100"
										on:click|stopPropagation={() => handleDeleteClick(datasetName)}
									>
										<Trash2 size={16} />
									</button>
								</AlertDialog.Trigger>

								<AlertDialog.Content>
									<AlertDialog.Header>
										<AlertDialog.Title>Delete Dataset</AlertDialog.Title>
										<AlertDialog.Description>
											Are you sure you want to delete {datasetToDelete}? This action cannot be
											undone.
										</AlertDialog.Description>
									</AlertDialog.Header>

									<AlertDialog.Footer>
										<AlertDialog.Cancel on:click={handleCancelClick}>Cancel</AlertDialog.Cancel>
										<AlertDialog.Action
											class="bg-red-500 text-white hover:bg-red-600"
											on:click={handleConfirmDelete}
										>
											Delete
										</AlertDialog.Action>
									</AlertDialog.Footer>
								</AlertDialog.Content>
							</AlertDialog.Root>
						{/if}
					</div>

					{#if loadingDatasets[datasetName]}
						<Progress value={loadingDatasets[datasetName].progress} />
					{/if}
				</li>
			{/each}
		</ul>
	{:else}
		<p class="text-gray-500">No datasets to display.</p>
	{/if}
</aside>
