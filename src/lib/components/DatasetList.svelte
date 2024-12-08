<script lang="ts">
	import { Trash2 } from 'lucide-svelte';
	import * as AlertDialog from '$lib/components/ui/alert-dialog';
	import * as Button from '$lib/components/ui/button';
	import { Progress } from '$lib/components/ui/progress';
	import { Badge } from '$lib/components/ui/badge';
	import { datasets, loadingDatasets, selectedDatasetId, datasetActions } from '$lib/stores';

	let datasetToDelete: string | null = null;
	let dialogOpen = false;

	function handleConfirmDelete() {
		if (datasetToDelete) {
			datasetActions.deleteDataset(datasetToDelete);
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

	$: allDatasetEntries = [...Object.keys($datasets), ...Object.keys($loadingDatasets)];
</script>

<div class="px-3 py-2">
	{#if allDatasetEntries.length > 0}
		<div class="space-y-2">
			{#each allDatasetEntries as datasetName}
				<div
					class="overflow-hidden rounded-lg border {datasetName === $selectedDatasetId
						? 'border-primary'
						: 'border-border'}"
				>
					<div class="flex flex-col gap-2">
						<div class="flex items-center justify-between p-3">
							<button
								type="button"
								class="flex-1 text-left hover:text-primary"
								on:click={() => datasetActions.selectDataset(datasetName)}
								disabled={$loadingDatasets[datasetName]}
							>
								<div class="flex items-center gap-2">
									<span class="truncate font-medium">
										{datasetName}
									</span>
									{#if $loadingDatasets[datasetName]}
										<Badge variant="secondary">Loading</Badge>
									{/if}
								</div>
							</button>

							{#if !$loadingDatasets[datasetName]}
								<AlertDialog.Root bind:open={dialogOpen}>
									<AlertDialog.Trigger asChild>
										<Button.Root
											variant="ghost"
											size="icon"
											class="h-8 w-8 text-muted-foreground hover:text-destructive"
											on:click={(e) => handleDeleteClick(e, datasetName)}
										>
											<Trash2 class="h-4 w-4" />
										</Button.Root>
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
												class="bg-destructive text-destructive-foreground hover:bg-destructive/90"
												on:click={handleConfirmDelete}
											>
												Delete
											</AlertDialog.Action>
										</AlertDialog.Footer>
									</AlertDialog.Content>
								</AlertDialog.Root>
							{/if}
						</div>

						{#if $loadingDatasets[datasetName]}
							<div class="px-3 pb-3">
								<Progress value={$loadingDatasets[datasetName].progress} />
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
