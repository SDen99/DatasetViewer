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

	// Service instances
	let workerPool: any;
	let datasetService: DatasetService;
	let uiStateService: UIStateService;

	// Reactive stores for UI state
	const isLoadingStore = writable(false);
	const uploadTimeStore = writable<number | null>(null);

	// State variables that will be automatically updated by Svelte
	let datasets: Record<string, any> = {};
	let selectedDataset: any = null;
	let selectedDatasetId: string | null = null;
	let selectedColumns: string[] = [];
	let columnOrder: string[] = [];

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
		if (!workerPool || !datasetService) {
			console.log('Missing required services:', {
				hasWorkerPool: !!workerPool,
				hasDatasetService: !!datasetService
			});
			return;
		}

		const input = event.target as HTMLInputElement;
		const files = input.files;

		if (!files || files.length === 0) {
			console.log('No files selected');
			return;
		}

		console.log('Starting file processing...', {
			numberOfFiles: files.length,
			fileNames: Array.from(files).map((f) => f.name)
		});

		isLoadingStore.set(true);
		const startTime = performance.now();

		try {
			for (const file of files) {
				if (!file.name.endsWith('.sas7bdat')) {
					console.warn(`Skipping ${file.name} - not a SAS file`);
					continue;
				}

				console.log(`Processing file: ${file.name}`);
				const arrayBuffer = await file.arrayBuffer();
				const result = await workerPool.processFile(arrayBuffer, file.name);

				// Log the processing result
				console.log('Worker processing result:', {
					fileName: file.name,
					hasData: !!result.data,
					dataLength: result.data?.length,
					details: result.details
				});

				// Create the dataset entry
				const datasetEntry = {
					fileName: file.name,
					...result,
					processingTime: (performance.now() - startTime) / 1000
				};

				console.log('Storing dataset:', {
					fileName: datasetEntry.fileName,
					processingTime: datasetEntry.processingTime,
					details: datasetEntry.details
				});

				// Store the dataset in IndexedDB
				await datasetService.addDataset(datasetEntry);
				console.log(`Successfully stored ${file.name} in IndexedDB`);
			}

			uploadTimeStore.set((performance.now() - startTime) / 1000);

			console.log('Refreshing UI state...');
			// Refresh the UI to show new datasets
			await refreshState();
			console.log('UI state refresh complete');
		} catch (error) {
			console.error('Error processing files:', error);
		} finally {
			isLoadingStore.set(false);
			console.log('File processing complete');
		}
	}

	// Handle dataset selection
	async function onSelectDataset(datasetId: string) {
		selectedDatasetId = datasetId;
		uiStateService.setSelectedDataset(datasetId);

		if (datasets[datasetId]) {
			// Only initialize if there's no existing state
			if (!uiStateService.hasColumnState(datasetId)) {
				const allColumns = Object.keys(datasets[datasetId].data[0] || {});
				const initialColumns = allColumns.slice(0, 5); // Take first 5 columns

				uiStateService.setColumnState(datasetId, initialColumns, allColumns);
			}
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
				variables={selectedDataset.details.columns}
				selectedColumns={new Set(selectedColumns)}
				{columnOrder}
				onColumnToggle={handleColumnToggle}
				onReorderVariables={handleColumnReorder}
			/>
		{/if}
	</div>

	<Footer
		uploadTime={selectedDataset?.processingTime.toFixed(2)}
		numColumns={selectedDataset?.details.num_columns}
		numRows={selectedDataset?.details.num_rows}
	/>
</main>
