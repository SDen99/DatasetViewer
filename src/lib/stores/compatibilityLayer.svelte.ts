// compatibilityLayer.svelte.ts
import { datasetStore } from './datasetStore.svelte';
import { tableUIStore } from './tableUIStore.svelte';
import { sortStore } from './sortStore.svelte';
import { DatasetService } from '../../datasetService';
import { UIStateService } from '../../UIStateService';
import type { Dataset, DatasetLoadingState, ProcessingStats, SortConfig } from '$lib/types';

class CompatibilityLayer {
	// Direct state declarations
	datasets = $state<Record<string, Dataset>>({});
	selectedDatasetId = $state<string | null>(null);
	isLoading = $state(false);
	loadingDatasets = $state<Record<string, DatasetLoadingState>>({});
	processingStats = $state<ProcessingStats>({
		uploadTime: null,
		numColumns: null,
		numRows: null,
		datasetSize: null
	});
	sortState = $state<SortConfig[]>([]);

	constructor() {
		$effect.root(() => {
			// Bidirectional sync with datasetStore
			$effect(() => {
				const { datasets, selectedDatasetId, isLoading, loadingDatasets } = datasetStore;
				this.datasets = datasets;
				this.selectedDatasetId = selectedDatasetId;
				this.isLoading = isLoading;
				this.loadingDatasets = loadingDatasets;
			});

			// Sync changes back to individual stores
			$effect(() => {
				if (datasetStore.datasets !== this.datasets) {
					datasetStore.setDatasets(this.datasets);
				}
			});

			// Add sort state synchronization
			$effect(() => {
				this.sortState = sortStore.sort;
			});
		});
	}

	// Computed property for selectedDataset
	selectedDataset = $derived.by(() => {
		const selectedId = this.selectedDatasetId;
		const datasets = this.datasets;

		if (!selectedId || !datasets[selectedId]) {
			return null;
		}

		return {
			fileName: selectedId,
			data: datasets[selectedId].data,
			details: datasets[selectedId].details,
			processingStats: datasets[selectedId].processingStats
		};
	});

	set sort(value: SortConfig[]) {
		sortStore.restore(value);
		this.sortState = value;
	}

	// Getters to maintain interface compatibility
	get selectedColumns() {
		return tableUIStore.selectedColumns;
	}

	get columnOrder() {
		return tableUIStore.columnOrder;
	}

	get columnWidths() {
		return tableUIStore.columnWidths;
	}

	get uiState() {
		return tableUIStore.uiState;
	}

	get sort() {
		return sortStore.sort;
	}

	// Only update through datasetStore
	setDatasets(newDatasets: Record<string, Dataset>) {
		this.datasets = newDatasets;
		datasetStore.setDatasets(newDatasets); // Add this back

		if (!this.selectedDatasetId && Object.keys(newDatasets).length > 0) {
			this.selectDataset(Object.keys(newDatasets)[0]);
		}
	}

	async deleteDataset(id: string) {
		try {
			// Delete from persistence first
			const datasetService = DatasetService.getInstance();
			await datasetService.removeDataset(id);

			// Update stores in correct order
			if (this.selectedDatasetId === id) {
				this.selectDataset(null); // This will trigger UI store resets
			}

			// Update dataset store last
			const newDatasets = { ...this.datasets };
			delete newDatasets[id];
			this.datasets = newDatasets;
			datasetStore.setDatasets(newDatasets);
		} catch (error) {
			console.error('Error deleting dataset:', error);
			throw error;
		}
	}

	selectDataset(id: string | null) {
		const prevId = this.selectedDatasetId;
		const uiService = UIStateService.getInstance();

		// Save current state before switching
		if (prevId) {
			uiService.setColumnState(
				prevId,
				Array.from(tableUIStore.selectedColumns),
				tableUIStore.columnOrder,
				tableUIStore.columnWidths,
				sortStore.sort // Save sort state
			);
		}

		// Update stores
		datasetStore.selectDataset(id);
		this.selectedDatasetId = id;

		if (id && this.datasets[id]) {
			if (uiService.hasColumnState(id)) {
				const state = uiService.getColumnState(id);
				tableUIStore.restore({
					selectedColumns: state.selectedColumns,
					columnOrder: state.columnOrder,
					columnWidths: state.columnWidths
				});
				sortStore.setSortConfig(state.sort || []); // Restore sort state
			}
		} else {
			tableUIStore.reset();
			sortStore.reset();
		}
	}

	// Add method to ensure loading states are properly synchronized
	updateLoadingDatasetState(fileName: string, state: DatasetLoadingState) {
		datasetStore.updateLoadingDatasetState(fileName, state);
		this.loadingDatasets = {
			...this.loadingDatasets,
			[fileName]: state
		};
	}

	updateColumnSelection(column: string, checked: boolean) {
		tableUIStore.updateColumnSelection(column, checked);
	}

	updateColumnOrder(newOrder: string[]) {
		tableUIStore.updateColumnOrder(newOrder);
	}

	updateColumnWidth(column: string, width: number) {
		tableUIStore.updateColumnWidth(column, width);
	}

	toggleSidebar(side: 'left' | 'right') {
		tableUIStore.toggleSidebar(side);
	}

	toggleSort(column: string) {
		sortStore.toggleSort(column);
	}

	setLoadingState(loading: boolean) {
		datasetStore.setLoadingState(loading);
		this.isLoading = loading;
	}

	updateLoadingDatasets(file: string) {
		datasetStore.updateLoadingDatasets(file);
		const newLoadingDatasets = { ...this.loadingDatasets };
		delete newLoadingDatasets[file];
		this.loadingDatasets = newLoadingDatasets;
	}

	setLoadingDatasetError(fileName: string, error: Error) {
		datasetStore.setLoadingDatasetError(fileName, error);
		this.loadingDatasets = {
			...this.loadingDatasets,
			[fileName]: {
				...this.loadingDatasets[fileName],
				status: 'error',
				error: error.message
			}
		};
	}

	updateProcessingStats(stats: Partial<ProcessingStats>) {
		datasetStore.updateProcessingStats(stats);
		this.processingStats = {
			...this.processingStats,
			...stats
		};
	}
}

// Export the singleton instance
export const dataTableStore = new CompatibilityLayer();
