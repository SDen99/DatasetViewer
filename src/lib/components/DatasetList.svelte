<script lang="ts">
	import { Trash2 } from 'svelte-lucide';
	import * as AlertDialog from '$lib/components/ui/alert-dialog/index.js';
	import * as Button from '$lib/components/ui/button/index.js';
	import { Progress } from '$lib/components/ui/progress';
	import { Badge } from '$lib/components/ui/badge';
	import { dataTableStore } from '$lib/stores/dataTableStore.svelte';

	let datasetToDelete: string | null = $state(null);
	let dialogOpen = $state(false);

	function handleConfirmDelete() {
		if (datasetToDelete) {
			dataTableStore.deleteDataset(datasetToDelete);
			datasetToDelete = null;
			dialogOpen = false;
		}
	}

	function handleDeleteClick(event: MouseEvent, datasetName: string) {
		event.stopPropagation();
		datasetToDelete = datasetName;
		dialogOpen = true;
	}

	function handleCancelClick() {
		datasetToDelete = null;
		dialogOpen = false;
	}

	let allDatasetEntries = $derived([
		...Object.keys(dataTableStore.datasets),
		...Object.keys(dataTableStore.loadingDatasets)
	]);
</script>

<div class="px-3 py-2">
	{#if allDatasetEntries.length > 0}
		<div class="space-y-2">
			{#each allDatasetEntries as datasetName}
				<div
					class="overflow-hidden rounded-lg border {datasetName === dataTableStore.selectedDatasetId
						? 'border-primary'
						: 'border-border'}"
				>
					<div class="flex flex-col gap-2">
						<div class="flex items-center justify-between p-3">
							<button
								type="button"
								class="flex-1 text-left hover:text-primary"
								onclick={() => dataTableStore.selectDataset(datasetName)}
								disabled={Boolean(dataTableStore.loadingDatasets[datasetName])}
							>
								<div class="flex items-center gap-2">
									<span class="truncate font-medium">
										{datasetName}
									</span>
									{#if dataTableStore.loadingDatasets[datasetName]}
										<Badge variant="secondary">Loading</Badge>
									{/if}
								</div>
							</button>

							{#if !dataTableStore.loadingDatasets[datasetName]}
								<AlertDialog.Root bind:open={dialogOpen}>
									<Button.Root
										variant="ghost"
										size="icon"
										class="h-8 w-8 text-muted-foreground hover:text-destructive"
										onclick={(e) => handleDeleteClick(e, datasetName)}
									>
										<Trash2 class="h-4 w-4" />
									</Button.Root>

									<AlertDialog.Portal>
										<AlertDialog.Content>
											<AlertDialog.Header>
												<AlertDialog.Title>Delete Dataset</AlertDialog.Title>
												<AlertDialog.Description>
													Are you sure you want to delete {datasetToDelete}? This action cannot be
													undone.
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
							{/if}
						</div>

						{#if dataTableStore.loadingDatasets[datasetName]}
							<div class="px-3 pb-3">
								<Progress value={dataTableStore.loadingDatasets[datasetName].progress} />
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
</div>
