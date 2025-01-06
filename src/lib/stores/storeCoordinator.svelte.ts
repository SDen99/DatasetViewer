import type { Dataset, DatasetLoadingState } from '$lib/types';
import { datasetStore } from './datasetStore.svelte';
import { tableUIStore } from './tableUIStore.svelte';
import { sortStore } from './sortStore.svelte';
import { UIStateService } from '../../UIStateService';
import { DatasetService } from '../../datasetService';

export class StoreCoordinator {
	private static instance: StoreCoordinator;

	private constructor() {}

	static getInstance(): StoreCoordinator {
		if (!StoreCoordinator.instance) {
			StoreCoordinator.instance = new StoreCoordinator();
		}
		return StoreCoordinator.instance;
	}

	// Initialize all stores and restore state
	async initializeStores() {
		const uiService = UIStateService.getInstance();
		const datasetService = DatasetService.getInstance();

		// Initialize DatasetService
		await datasetService.initialize();

		// Load datasets from IndexedDB
		const savedDatasets = await datasetService.getAllDatasets();

		// Initialize dataset store
		datasetStore.setDatasets(savedDatasets);

		// Restore selected dataset if it exists
		const selectedId = uiService.getSelectedDataset();
		if (selectedId && savedDatasets[selectedId]) {
			this.selectDataset(selectedId);
		}
	}

	// Handle dataset selection - coordinates changes across all stores
	selectDataset(datasetId: string | null) {
		const prevId = datasetStore.selectedDatasetId;
		const uiService = UIStateService.getInstance();

		// Save current state
		if (prevId) {
			uiService.setColumnState(
				prevId,
				Array.from(tableUIStore.selectedColumns),
				tableUIStore.columnOrder,
				tableUIStore.columnWidths,
				sortStore.sort
			);
		}

		// Update selection
		datasetStore.selectDataset(datasetId);

		// Handle new selection state
		if (datasetId && datasetStore.datasets[datasetId]) {
			const dataset = datasetStore.datasets[datasetId];
			if (dataset?.data?.[0]) {
				const allColumns = Object.keys(dataset.data[0]);

				if (uiService.hasColumnState(datasetId)) {
					const state = uiService.getColumnState(datasetId);
					tableUIStore.selectedColumns = new Set(state.selectedColumns);
					tableUIStore.columnOrder = state.columnOrder;
					tableUIStore.columnWidths = state.columnWidths || {};
					sortStore.setSortConfig(state.sort || []);
				} else {
					tableUIStore.selectedColumns = new Set(allColumns.slice(0, 5));
					tableUIStore.columnOrder = allColumns;
					tableUIStore.columnWidths = {};
					sortStore.setSortConfig([]);
				}

				uiService.setSelectedDataset(datasetId);
			}
		} else {
			tableUIStore.selectedColumns = new Set();
			tableUIStore.columnOrder = [];
			tableUIStore.columnWidths = {};
			sortStore.setSortConfig([]);
			uiService.setSelectedDataset(null);
		}
	}

	// Handle dataset deletion
	async deleteDataset(datasetId: string) {
		// First clear UI states
		if (datasetStore.selectedDatasetId === datasetId) {
			this.selectDataset(null);
		}

		// Remove from both persistence layers
		const [uiService, datasetService] = [
			UIStateService.getInstance(),
			DatasetService.getInstance()
		];

		await Promise.all([
			uiService.clearStateForDataset(datasetId),
			datasetService.removeDataset(datasetId)
		]);

		// Finally update store
		await datasetStore.deleteDataset(datasetId);
	}

	// Handle new dataset addition
	async addDataset(fileName: string, dataset: Dataset) {
		const currentDatasets = { ...datasetStore.datasets };
		currentDatasets[fileName] = dataset;

		// Update dataset store
		datasetStore.setDatasets(currentDatasets);

		// Select the new dataset
		this.selectDataset(fileName);
	}

	// Update loading states
	updateLoadingState(fileName: string, state: DatasetLoadingState) {
		datasetStore.updateLoadingDatasetState(fileName, state);
	}

	// Save current state
	saveCurrentState() {
		const currentDatasetId = datasetStore.selectedDatasetId;
		if (!currentDatasetId) return;

		const uiService = UIStateService.getInstance();
		uiService.setColumnState(
			currentDatasetId,
			Array.from(tableUIStore.selectedColumns),
			tableUIStore.columnOrder,
			tableUIStore.columnWidths,
			sortStore.sort
		);
	}

	updateColumnWidth(column: string, width: number) {
		// Update UI state
		tableUIStore.updateColumnWidth(column, width);

		// Persist changes if we have a selected dataset
		const datasetId = datasetStore.selectedDatasetId;
		if (datasetId) {
			const uiService = UIStateService.getInstance();
			uiService.updateColumnWidth(datasetId, column, width);
		}
	}

	private async loadSavedDatasets(): Promise<Record<string, Dataset>> {
		try {
			const datasetService = DatasetService.getInstance();
			await datasetService.initialize(); // Make sure DB is initialized
			return await datasetService.getAllDatasets();
		} catch (error) {
			console.error('Failed to load saved datasets:', error);
			return {};
		}
	}

	// Delete these once the code is cleaned up and all references are updated
	get selectedDataset() {
		return datasetStore.selectedDataset;
	}

	get datasets() {
		return datasetStore.datasets;
	}

	// Add legacy method signatures
	setLoadingState(loading: boolean) {
		datasetStore.setLoadingState(loading);
	}
}

export const storeCoordinator = StoreCoordinator.getInstance();
