<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { browser } from '$app/environment';
	import * as Card from '$lib/components/ui/card';
	import * as Button from '$lib/components/ui/button';
	import * as ScrollArea from '$lib/components/ui/scroll-area';
	import { PanelLeftOpen, PanelRightOpen, PanelLeftClose, PanelRightClose } from 'lucide-svelte';
	import type { Dataset, DatasetLoadingState } from '$lib/types';

	import Navigation from '$lib/components/Navigation.svelte';
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
		selectedDatasetId,
		loadingDatasets,
		isLoading,
		uiState,
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
				datasetActions.selectDataset(selectedId, uiStateService);
			}
		} catch (error) {
			console.error('Error during initialization:', error);
		}
	});

	onDestroy(() => {
		workerPool?.terminate();
	});

	function initializeColumnState(dataset: Dataset, columnState: any) {
		if (!dataset?.data?.[0]) return;

		const defaultColumns = Object.keys(dataset.data[0]);
		datasetActions.updateColumnSelection(defaultColumns.slice(0, 5).map((col) => [col, true]));

		datasetActions.updateColumnOrder(
			columnState.columnOrder.length > 0 ? columnState.columnOrder : defaultColumns
		);
	}

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
	<main class="flex max-h-screen min-h-screen flex-col bg-background">
		<Navigation {handleFileChangeEvent} isLoading={$isLoading} />

		<!-- Sidebar toggle buttons -->
		<div class="fixed bottom-4 left-4 z-50 flex gap-2">
			{#if !$uiState.leftSidebarOpen}
				<Button.Root
					variant="default"
					size="icon"
					on:click={() => datasetActions.toggleSidebar('left')}
					aria-label="Show left sidebar"
				>
					<PanelLeftClose class="h-4 w-4" />
				</Button.Root>
			{/if}

			{#if !$uiState.rightSidebarOpen}
				<Button.Root
					variant="default"
					size="icon"
					on:click={() => datasetActions.toggleSidebar('right')}
					aria-label="Show right sidebar"
				>
					<PanelRightClose class="h-4 w-4" />
				</Button.Root>
			{/if}
		</div>

		<div class="flex h-[calc(100vh-8rem)] flex-1 overflow-hidden">
			<!-- Left Sidebar -->
			<div
				class="relative {$uiState.leftSidebarOpen
					? 'w-80'
					: 'w-0'} transition-all duration-300 ease-in-out"
			>
				<ScrollArea.Root class="h-[calc(100vh-8rem)] border-r border-border bg-card">
					<div class="p-4">
						<div class="mb-4 flex items-center justify-between">
							<h2 class="text-lg font-semibold">Datasets</h2>
							<Button.Root
								variant="ghost"
								size="icon"
								on:click={() => datasetActions.toggleSidebar('left')}
							>
								<PanelLeftOpen class="h-4 w-4" />
							</Button.Root>
						</div>
						<DatasetList />
					</div>
				</ScrollArea.Root>
			</div>

			<!-- Main Table -->
			<div class="min-w-0 flex-1 overflow-hidden">
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
			</div>

			<!-- Right Sidebar -->
			<div
				class="relative {$uiState.rightSidebarOpen
					? 'w-80'
					: 'w-0'} transition-all duration-300 ease-in-out"
			>
				{#if $selectedDataset}
					<ScrollArea.Root class="h-[calc(100vh-8rem)] border-l border-border bg-card">
						<div class="p-4">
							<div class="mb-4 flex items-center justify-between">
								<h2 class="text-lg font-semibold">Variables</h2>
								<Button.Root
									variant="ghost"
									size="icon"
									on:click={() => datasetActions.toggleSidebar('right')}
								>
									<PanelRightOpen class="h-4 w-4" />
								</Button.Root>
							</div>
							<VariableList
								variables={$selectedDataset.details.columns.map((col: string) => ({
									name: col,
									dtype: $selectedDataset.details.dtypes[col]
								}))}
							/>
						</div>
					</ScrollArea.Root>
				{/if}
			</div>
		</div>
		<Footer />
	</main>
{/if}
