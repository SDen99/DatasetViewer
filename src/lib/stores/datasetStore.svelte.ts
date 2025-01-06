import type { Dataset, DatasetLoadingState, ProcessingStats } from '$lib/types';
import { StoreEvents } from '$lib/stores/storeEvents.svelte';
import { DatasetService } from '../../datasetService';
import { tableUIStore } from './tableUIStore.svelte';
import { sortStore } from './sortStore.svelte';
import { UIStateService } from '../../UIStateService';

export class DatasetStore {
	private static instance: DatasetStore;

	// State
	datasets = $state<Record<string, Dataset>>({});
	selectedDatasetId = $state<string | null>(null);
	isLoading = $state(false);
	loadingDatasets = $state<Record<string, DatasetLoadingState>>({});

	constructor() {
		// Create an effect root for store initialization
		$effect.root(() => {
			// Create effect to track and log dataset changes
			$effect(() => {
				$inspect('[DatasetStore] Datasets updated:', this.datasets);
				$inspect('[DatasetStore] Selected dataset:', this.selectedDatasetId);
			});
		});
	}

	processingStats = $state<ProcessingStats>({
		uploadTime: null,
		numColumns: null,
		numRows: null,
		datasetSize: null
	});

	updateProcessingStats(stats: Partial<ProcessingStats>) {
		this.processingStats = {
			...this.processingStats,
			...stats
		};
	}

	static getInstance(): DatasetStore {
		if (!DatasetStore.instance) {
			DatasetStore.instance = new DatasetStore();
		}
		return DatasetStore.instance;
	}

	setDatasets(newDatasets: Record<string, Dataset>) {
		console.log('[DatasetStore] Setting datasets:', Object.keys(newDatasets));
		this.datasets = newDatasets;

		// Only auto-select if we don't have a current selection
		if (!this.selectedDatasetId && Object.keys(newDatasets).length > 0) {
			this.selectDataset(Object.keys(newDatasets)[0]);
		}
	}

	selectDataset(id: string | null) {
		const prevId = this.selectedDatasetId;
		const uiService = UIStateService.getInstance();

		// Save current state
		if (prevId) {
			uiService.setColumnState(
				prevId,
				Array.from(tableUIStore.selectedColumns),
				tableUIStore.columnOrder,
				tableUIStore.columnWidths,
				sortStore.sort // Save current sort state
			);
		}

		this.selectedDatasetId = id;

		if (id && this.datasets[id]) {
			if (uiService.hasColumnState(id)) {
				const state = uiService.getColumnState(id);
				sortStore.restore(state.sort || []); // Restore sort state
				tableUIStore.restore({
					selectedColumns: state.selectedColumns,
					columnOrder: state.columnOrder,
					columnWidths: state.columnWidths
				});
			}
		} else {
			tableUIStore.reset();
			sortStore.reset(); // Reset sort state when no dataset selected
		}
	}

	async deleteDataset(id: string) {
		try {
			// Remove from IndexedDB first
			const datasetService = DatasetService.getInstance();
			await datasetService.removeDataset(id);

			// Update local state
			const newDatasets = { ...this.datasets };
			delete newDatasets[id];
			this.datasets = newDatasets;

			// Clear UI state if needed
			if (this.selectedDatasetId === id) {
				this.selectDataset(null);
				tableUIStore.reset();
				sortStore.reset();
			}
		} catch (error) {
			console.error('Error deleting dataset:', error);
			throw error;
		}
	}

	setLoadingState(loading: boolean) {
		this.isLoading = loading;
	}

	updateLoadingDatasets(file: string) {
		const newLoadingDatasets = { ...this.loadingDatasets };
		delete newLoadingDatasets[file];
		this.loadingDatasets = newLoadingDatasets;
	}

	setLoadingDatasetError(fileName: string, error: Error) {
		this.loadingDatasets = {
			...this.loadingDatasets,
			[fileName]: {
				...this.loadingDatasets[fileName],
				status: 'error',
				error: error.message
			}
		};
	}

	updateLoadingDatasetState(fileName: string, state: DatasetLoadingState) {
		this.loadingDatasets = {
			...this.loadingDatasets,
			[fileName]: state
		};
	}
}

export const datasetStore = DatasetStore.getInstance();
