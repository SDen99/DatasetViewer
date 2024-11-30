<script lang="ts">
	import { Trash2 } from 'lucide-svelte';
	import * as AlertDialog from '$lib/components/ui/alert-dialog';

	export let datasets: Record<string, any>;
	export let selectedDataset: string | null;
	export let onSelectDataset: (dataset: string) => void;
	export let onDeleteDataset: (dataset: string) => void;

	$: datasetEntries = Object.keys(datasets);

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
	{#if datasetEntries.length > 0}
		<ul class="space-y-2">
			{#each datasetEntries as datasetName}
				<li class="flex items-center pl-2">
					<button
						type="button"
						class="flex-1 cursor-pointer rounded px-2 py-1 text-left text-gray-700 hover:bg-gray-100
                               {datasetName === selectedDataset
							? 'bg-red-500 text-white hover:bg-red-600'
							: ''}"
						on:click={() => onSelectDataset(datasetName)}
					>
						{datasetName}
					</button>

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
									Are you sure you want to delete {datasetToDelete}? This action cannot be undone.
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
				</li>
			{/each}
		</ul>
	{:else}
		<p class="text-gray-500">No datasets to display.</p>
	{/if}
</aside>
