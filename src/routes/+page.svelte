<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { browser } from '$app/environment';
	import * as Card from '$lib/components/ui/card';
	import type { DatasetLoadingState } from '$lib/types';

	import Navigation from '$lib/components/Navigation.svelte';
	import MainLayout from '$lib/components/MainLayout.svelte';
	import DatasetList from '$lib/components/DatasetList.svelte';
	import DataTable from '$lib/components/DataTable.svelte';
	import VariableList from '$lib/components/VariableList.svelte';
	import Footer from '$lib/components/Footer.svelte';
	import { createWorkerPool } from '../workerPool';
	import { DatasetService } from '../datasetService';
	import { UIStateService } from '../UIStateService';

	import {
		datasets,
		selectedDataset,
		loadingDatasets,
		isLoading,
		datasetActions
	} from '$lib/stores';

	// Service instances
	let workerPool: ReturnType<typeof createWorkerPool>;
	let datasetService: DatasetService;
	let uiStateService: UIStateService;

	// Initialize services and load initial data
	onMount(async () => {
		if (!browser) return;

		try {
			// Initialize services
			datasetService = DatasetService.getInstance();
			uiStateService = UIStateService.getInstance();
			await datasetService.initialize();

			// Initialize worker pool
			workerPool = createWorkerPool();
			if (workerPool) {
				await workerPool.initialize();
			}

			// Load initial datasets
			const initialDatasets = await datasetService.getAllDatasets();
			datasets.set(initialDatasets);

			// Load initial UI state
			const selectedId = uiStateService.getSelectedDataset();
			if (selectedId) {
				datasetActions.selectDataset(selectedId);
			}
		} catch (error) {
			console.error('Error during initialization:', error);
		}
	});

	onDestroy(() => {
		workerPool?.terminate();
	});

	async function handleFileChangeEvent(event: Event) {
		if (!workerPool || !datasetService) return;

		const files = (event.target as HTMLInputElement).files;
		if (!files?.length) return;

		datasetActions.setLoadingState(true);

		for (const file of files) {
			if (!file.name.endsWith('.sas7bdat')) continue;

			try {
				const result = await processFile(file);
				await handleProcessingSuccess(file, result);
			} catch (error) {
				handleProcessingError(file, error);
			}
		}

		datasetActions.setLoadingState(false);
	}

	async function processFile(file: File) {
		loadingDatasets.update((state) => ({
			...state,
			[file.name]: {
				progress: 0,
				fileName: file.name,
				totalSize: file.size,
				loadedSize: 0,
				status: 'loading'
			}
		}));

		return await workerPool.processFile(file, file.name, (state: DatasetLoadingState) => {
			loadingDatasets.update((current) => ({
				...current,
				[file.name]: state
			}));
		});
	}

	async function handleProcessingSuccess(file: File, result: any) {
		const processingStats = {
			uploadTime: Number(result.processingTime?.toFixed(2)),
			numColumns: result.details?.num_columns,
			numRows: result.details?.num_rows,
			datasetSize: file.size
		};

		datasetActions.updateProcessingStats(processingStats);

		await datasetService.addDataset({
			fileName: file.name,
			...result,
			processingStats
		});

		// Update datasets store
		const updatedDatasets = await datasetService.getAllDatasets();
		datasets.set(updatedDatasets);

		// Clear loading state
		loadingDatasets.update((state) => {
			const newState = { ...state };
			delete newState[file.name];
			return newState;
		});
	}

	function handleProcessingError(file: File, error: Error) {
		loadingDatasets.update((state) => ({
			...state,
			[file.name]: {
				...state[file.name],
				status: 'error',
				error: error.message
			}
		}));
	}

</script>

{#if browser}
<MainLayout>
	<Navigation slot="navigation" {handleFileChangeEvent} isLoading={$isLoading} />
	
	<!-- Left Sidebar Content -->
	<svelte:fragment slot="left-sidebar">
	  <DatasetList />
	</svelte:fragment>
	
	<!-- Main Content -->
	<svelte:fragment slot="main-content">
	  {#if $selectedDataset}
		<div class="h-full">
		  <Card.Root class="h-full">
			<Card.Content class="h-full p-0">
			  <DataTable data={$selectedDataset.data} />
			</Card.Content>
		  </Card.Root>
		</div>
	  {:else}
		<div class="flex flex-1 items-center justify-center">
		  <div class="text-center text-muted-foreground">
			<h3 class="text-lg font-medium">No dataset selected</h3>
			<p class="text-sm">Select a dataset from the sidebar to view its contents</p>
		  </div>
		</div>
	  {/if}
	</svelte:fragment>
	
	<!-- Right Sidebar Content -->
	<svelte:fragment slot="right-sidebar">
		{#if $selectedDataset}
		<VariableList
		variables={$selectedDataset.details.columns.map((col: string) => ({
		  name: col,
		  dtype: $selectedDataset.details.dtypes[col]
		}))}
	  />
	  {/if}
	</svelte:fragment>
	<Footer slot="footer" />
  </MainLayout>
{/if}
