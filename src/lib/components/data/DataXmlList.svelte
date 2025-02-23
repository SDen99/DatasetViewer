<script lang="ts">
	import { ScrollArea } from '$lib/components/core/scroll-area';
	import { Input } from '$lib/components/core/input';
	import { Search } from 'lucide-svelte';
	import { datasetStore } from '$lib/core/stores/datasetStore.svelte';
	import { storeCoordinator } from '$lib/core/stores/storeCoordinator.svelte';
	import { DatasetService } from '$lib/core/services/datasetService';
	import DatasetCardItem from '../DatasetCardItem.svelte';
	import DatasetDeleteDialog from '../DatasetDeleteDialog.svelte';
	import { normalizeDatasetId } from '$lib/core/utils/datasetUtils';

	// Local state using Runes
	let dialogOpen = $state(false);
	let datasetToDelete = $state<string | null>(null);
	let isInitialized = $state(false);
	let isDeleting = $state(false);
	let searchTerm = $state('');

	// Using derived Runes
	const datasets = $derived.by(() => {
		if (!isInitialized) return [];

		const allDatasets = datasetStore.availableDatasets;
		if (!searchTerm) return allDatasets;

		return allDatasets.filter((name) => {
			const metadata = getDatasetMetadata(name);
			const searchLower = searchTerm.toLowerCase();

			return (
				name.toLowerCase().includes(searchLower) ||
				metadata.description?.toLowerCase().includes(searchLower) ||
				metadata.class?.toLowerCase().includes(searchLower)
			);
		});
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

	const getDatasetMetadata = (name: string) => {
		const normalizedName = normalizeDatasetId(name);
		const { SDTM, ADaM } = datasetStore.defineXmlDatasets;

		const metadata =
			SDTM?.ItemGroups?.find(
				(g) => normalizeDatasetId(g.SASDatasetName || g.Name || '') === normalizedName
			) ||
			ADaM?.ItemGroups?.find(
				(g) => normalizeDatasetId(g.SASDatasetName || g.Name || '') === normalizedName
			);

		return {
			description: metadata?.Description || undefined,
			class: metadata?.Class || undefined
		};
	};

	$effect.root(() => {
		$effect(() => {
			console.log('State Debug:', {
				isInitialized,
				isDeleting,
				datasets: datasets.length,
				hasDatasetToDelete: Boolean(datasetToDelete),
				selectedDatasetId,
				searchTerm
			});
		});
	});
</script>

<div class="flex flex-col">
	<h3 class="pb-3 text-lg font-semibold">Datasets:</h3>

	<!-- Search Input -->
	<div class="relative mb-3 px-3">
		<Search class="absolute left-5 top-2.5 h-4 w-4 text-muted-foreground" />
		<Input type="text" placeholder="Search datasets..." bind:value={searchTerm} class="pl-9" />
	</div>

	<ScrollArea class="h-[calc(100vh-18rem)]">
		<div class="px-3">
			<div class="space-y-2">
				{#if datasets.length > 0}
					{#each datasets as name}
						{@const metadata = getDatasetMetadata(name)}
						<DatasetCardItem
							{name}
							description={metadata.description}
							class={metadata.class}
							state={datasetStore.getDatasetState(name)}
							isSelected={normalizeDatasetId(name) === normalizeDatasetId(selectedDatasetId)}
							loadingProgress={datasetStore.getDatasetState(name).loadingState}
							onDelete={() => handleDeleteClick(name)}
							onClick={() => handleDatasetClick(name)}
						/>
					{/each}
				{:else}
					<div class="flex h-[150px] items-center justify-center text-muted-foreground">
						<p>{searchTerm ? 'No matching datasets found' : 'No datasets available'}</p>
					</div>
				{/if}
			</div>
		</div>
	</ScrollArea>
</div>

<DatasetDeleteDialog
	open={dialogOpen}
	datasetName={datasetToDelete}
	onConfirm={handleConfirmDelete}
	onCancel={handleCancelDelete}
/>
