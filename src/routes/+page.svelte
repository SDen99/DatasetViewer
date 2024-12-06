<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { browser } from '$app/environment';
	import { writable } from 'svelte/store';
	import Navigation from '$lib/components/Navigation.svelte';
	import DatasetList from '$lib/components/DatasetList.svelte';
	import DataTable from '$lib/components/DataTable.svelte';
	import VariableList from '$lib/components/VariableList.svelte';
	import Footer from '$lib/components/Footer.svelte';
	import { createWorkerPool } from '../workerPool';
	import { DatasetService } from '../datasetService';
	import { UIStateService } from '../UIStateService';
	import type { DatasetLoadingState } from '../types';

	// Service instances
	let workerPool: any;
	let datasetService: DatasetService;
	let uiStateService: UIStateService;

	// Reactive stores for UI state
	const isLoadingStore = writable(false);
	const processingStatsStore = writable({
		uploadTime: null,
		numColumns: null,
		numRows: null,
		datasetSize: null
	});
	const loadingDatasetsStore = writable<Record<string, DatasetLoadingState>>({});

	// State variables that will be automatically updated by Svelte
	let datasets: Record<string, any> = {};
	let selectedDataset: any = null;
	let selectedDatasetId: string | null = null;
	let selectedColumns: string[] = [];
	let columnOrder: string[] = [];

	interface LoadingDatasets {
		[key: string]: DatasetLoadingState;
	}

	// Initialize services and load initial data
	onMount(async () => {
		if (browser) {
			// Initialize services
			datasetService = DatasetService.getInstance();
			uiStateService = UIStateService.getInstance();
			await datasetService.initialize();

			try {
				datasets = await datasetService.getAllDatasets();
				console.log('Initial datasets loaded:', datasets);
			} catch (error) {
				console.error('Error loading initial datasets:', error);
			}

			// Initialize worker pool
			workerPool = createWorkerPool();
			if (workerPool) {
				await workerPool.initialize();
			}

			// Load initial state
			await refreshState();
		}
	});

	// Clean up resources
	onDestroy(() => {
		workerPool?.terminate();
	});

	// Function to refresh all state from our services
	async function refreshState() {
		datasets = await datasetService.getAllDatasets();
		selectedDatasetId = uiStateService.getSelectedDataset();

		if (selectedDatasetId && datasets[selectedDatasetId]) {
			selectedDataset = datasets[selectedDatasetId];
			const columnState = uiStateService.getColumnState(selectedDatasetId);

			// If we have existing column state, use it
			if (columnState.selectedColumns.length > 0) {
				selectedColumns = columnState.selectedColumns;
			} else {
				// Initialize with default columns if no state exists
				selectedColumns = Object.keys(selectedDataset.data[0] || {}).slice(0, 5);
			}

			// If we have existing column order, use it
			if (columnState.columnOrder.length > 0) {
				columnOrder = columnState.columnOrder;
			} else {
				// Initialize with all columns if no order exists
				columnOrder = Object.keys(selectedDataset.data[0] || {});
			}
		} else {
			selectedDataset = null;
			selectedColumns = [];
			columnOrder = [];
		}
	}

	// Handle file uploads
	async function handleFileChangeEvent(event: Event) {
		if (!workerPool || !datasetService) return;

		const files = (event.target as HTMLInputElement).files;
		if (!files?.length) return;

		for (const file of files) {
			if (!file.name.endsWith('.sas7bdat')) continue;

			// Add the file to the loading state immediately
			loadingDatasetsStore.update((state) => ({
				...state,
				[file.name]: {
					progress: 0,
					fileName: file.name,
					totalSize: file.size,
					loadedSize: 0,
					status: 'loading'
				}
			}));

			try {
				const result = await workerPool.processFile(
					file,
					file.name,
					(state: DatasetLoadingState) => {
						loadingDatasetsStore.update((current) => ({
							...current,
							[file.name]: state
						}));
					}
				);

				processingStatsStore.set({
					uploadTime: result.processingTime?.toFixed(2),
					numColumns: result.details?.num_columns,
					numRows: result.details?.num_rows,
					datasetSize: file.size
				});

				console.log('Processing complete:', result);

				const datasetEntry = {
					fileName: file.name,
					...result
				};

				await datasetService.addDataset({
					fileName: file.name,
					...result,
					processingStats: {
						uploadTime: Number(result.processingTime?.toFixed(2)),
						numColumns: result.details?.num_columns,
						numRows: result.details?.num_rows,
						datasetSize: file.size
					}
				});

				// Remove from loading state once complete
				loadingDatasetsStore.update((state) => {
					const newState = { ...state };
					delete newState[file.name];
					return newState;
				});

				// Refresh the datasets list
				await refreshState();
			} catch (error) {
				loadingDatasetsStore.update((state) => ({
					...state,
					[file.name]: {
						...state[file.name],
						status: 'error',
						error: error.message
					}
				}));
			}
		}
	}

	// Handle dataset selection
	async function onSelectDataset(datasetId: string) {
		selectedDatasetId = datasetId;
		uiStateService.setSelectedDataset(datasetId);

		if (datasets[datasetId]) {
			const stats = datasets[datasetId].processingStats || {
				uploadTime: null,
				numColumns: null,
				numRows: null,
				datasetSize: null
			};
			processingStatsStore.set(stats);
		}

		await refreshState();
	}

	async function onDeleteDataset(datasetId: string) {
		try {
			console.log(`Starting deletion of dataset: ${datasetId}`);

			// Remove from IndexedDB
			await datasetService.removeDataset(datasetId);
			console.log(`Dataset removed from IndexedDB: ${datasetId}`);

			// Clear UI state for this dataset
			uiStateService.clearStateForDataset(datasetId);
			console.log(`UI state cleared for dataset: ${datasetId}`);

			// If the deleted dataset was selected, clear the selection
			if (selectedDatasetId === datasetId) {
				selectedDatasetId = null;
				selectedDataset = null;
				selectedColumns = [];
				columnOrder = [];
				console.log('Cleared selected dataset state');
			}

			// Force a refresh of the datasets list
			datasets = await datasetService.getAllDatasets();
			console.log('Dataset list refreshed', datasets);

			// Force a Svelte update by reassigning the datasets object
			datasets = { ...datasets };

			console.log(`Successfully completed deletion of dataset: ${datasetId}`);
		} catch (error) {
			console.error('Error deleting dataset:', error);
			// You might want to add user-visible error handling here
		}
	}

	// Handle column visibility toggling
	function handleColumnToggle(column: string, checked: boolean) {
		if (!selectedDatasetId) return;

		// Create a new array instead of modifying the existing Set
		const newSelectedColumns = checked
			? [...selectedColumns, column]
			: selectedColumns.filter((col) => col !== column);

		// Update UI state
		uiStateService.setColumnState(selectedDatasetId, newSelectedColumns, columnOrder);

		// Update local state
		selectedColumns = newSelectedColumns;
	}
	// Handle column reordering
	function handleColumnReorder(newOrder: string[]) {
		if (!selectedDatasetId) return;

		uiStateService.setColumnState(selectedDatasetId, selectedColumns, newOrder);

		// Update local state
		columnOrder = newOrder;
	}
</script>

<main class="flex min-h-screen flex-col bg-gray-100">
	<Navigation {handleFileChangeEvent} isLoading={$isLoadingStore} />

	<div class="flex flex-1 overflow-hidden">
		<DatasetList
			{datasets}
			selectedDataset={selectedDatasetId}
			{onSelectDataset}
			{onDeleteDataset}
			loadingDatasets={$loadingDatasetsStore}
		/>
		<section class="flex-1 overflow-x-auto p-4">
			{#if selectedDataset}
				<DataTable
					data={selectedDataset.data}
					selectedColumns={new Set(selectedColumns)}
					{columnOrder}
					onReorderColumns={handleColumnReorder}
				/>
			{/if}
		</section>

		{#if selectedDataset}
			<VariableList
				variables={selectedDataset.details.columns.map((col: string) => ({
					name: col,
					dtype: selectedDataset.details.dtypes[col]
				}))}
				selectedColumns={new Set(selectedColumns)}
				{columnOrder}
				onColumnToggle={handleColumnToggle}
				onReorderVariables={handleColumnReorder}
			/>
		{/if}
	</div>

	<Footer
		uploadTime={$processingStatsStore.uploadTime}
		numColumns={$processingStatsStore.numColumns}
		numRows={$processingStatsStore.numRows}
		datasetSize={$processingStatsStore.datasetSize}
	/>
</main>
