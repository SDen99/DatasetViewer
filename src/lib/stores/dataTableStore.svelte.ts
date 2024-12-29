// src/lib/stores/dataTableStore.ts
import type { Dataset, DatasetLoadingState, ProcessingStats, SortConfig } from '$lib/types';
import { DatasetService } from '../../datasetService';
import { UIStateService } from '../../UIStateService';
export class DataTableStore {
	private static instance: DataTableStore;

	// State
	datasets = $state<Record<string, Dataset>>({});
	selectedDatasetId = $state<string | null>(null);
	selectedColumns = $state<Set<string>>(new Set());
	columnOrder = $state<string[]>([]);
	columnWidths = $state<Record<string, number>>({});
	isLoading = $state(false);
	loadingDatasets = $state<Record<string, DatasetLoadingState>>({});
	uiState = $state({
		leftSidebarOpen: true,
		rightSidebarOpen: true
	});
	processingStats = $state<ProcessingStats>({
		uploadTime: null,
		numColumns: null,
		numRows: null,
		datasetSize: null
	});

	selectedDataset = $derived(this.selectedDatasetId ? this.datasets[this.selectedDatasetId] : null);

	private constructor() {}

	static getInstance(): DataTableStore {
		if (!DataTableStore.instance) {
			DataTableStore.instance = new DataTableStore();
		}
		return DataTableStore.instance;
	}

	setDatasets(newDatasets: Record<string, Dataset>) {
		this.datasets = newDatasets;
	}

	selectDataset(id: string | null) {
		const prevId = this.selectedDatasetId;

		if (prevId) {
			const currentState = {
				selectedColumns: Array.from(this.selectedColumns),
				columnOrder: this.columnOrder,
				columnWidths: this.columnWidths,
				sort: this.sort
			};

			UIStateService.getInstance().setColumnState(
				prevId,
				currentState.selectedColumns,
				currentState.columnOrder,
				currentState.columnWidths,
				currentState.sort
			);
		}

		this.selectedDatasetId = id;

		if (id) {
			const uiService = UIStateService.getInstance();
			const dataset = this.datasets[id];

			if (dataset?.data?.[0]) {
				const allColumns = Object.keys(dataset.data[0]);

				if (uiService.hasColumnState(id)) {
					const state = uiService.getColumnState(id);
					this.selectedColumns = new Set(state.selectedColumns);
					this.columnOrder = state.columnOrder;
					this.columnWidths = state.columnWidths || {};
					this.sort = state.sort || [];
				} else {
					this.selectedColumns = new Set(allColumns.slice(0, 5));
					this.columnOrder = allColumns;
					this.columnWidths = {};
					this.sort = [];
				}
			}

			uiService.setSelectedDataset(id);
		} else {
			this.selectedColumns = new Set();
			this.columnOrder = [];
			this.columnWidths = {};
			this.sort = [];
			UIStateService.getInstance().setSelectedDataset(null);
		}
	}

	async deleteDataset(id: string) {
		try {
			// First clean up the UI state
			if (this.selectedDatasetId === id) {
				// Clear local state first
				this.columnOrder = [];
				this.columnWidths = {};
				this.selectedColumns = new Set();
				this.selectedDatasetId = null;
			}

			// Then remove from UIService and DatasetService
			await UIStateService.getInstance().clearStateForDataset(id);
			await DatasetService.getInstance().removeDataset(id);

			// Finally update the datasets object
			const newDatasets = { ...this.datasets };
			delete newDatasets[id];
			this.datasets = newDatasets;
		} catch (error) {
			console.error('Error deleting dataset:', error);
		}
	}

	updateColumnSelection(column: string, checked: boolean) {
		if (!this.selectedDatasetId) return;

		// Create a new Set instance with the current values
		const newSet = new Set(this.selectedColumns);

		if (checked) {
			newSet.add(column);
		} else {
			newSet.delete(column);
		}

		// Assign the new Set to trigger reactivity
		this.selectedColumns = newSet;

		UIStateService.getInstance().setColumnState(
			this.selectedDatasetId,
			Array.from(this.selectedColumns),
			this.columnOrder,
			this.columnWidths
		);
	}

	updateColumnOrder(newOrder: string[]) {
		if (!this.selectedDatasetId) return;

		this.columnOrder = newOrder;

		UIStateService.getInstance().setColumnState(
			this.selectedDatasetId,
			Array.from(this.selectedColumns),
			newOrder,
			this.columnWidths
		);
	}

	updateColumnWidth(column: string, width: number) {
		if (!this.selectedDatasetId) return;

		this.columnWidths = {
			...this.columnWidths,
			[column]: width
		};

		UIStateService.getInstance().updateColumnWidth(this.selectedDatasetId, column, width);
	}

	toggleSidebar(side: 'left' | 'right') {
		this.uiState = {
			...this.uiState,
			[`${side}SidebarOpen`]: !this.uiState[`${side}SidebarOpen`]
		};
	}

	setLoadingState(loading: boolean) {
		this.isLoading = loading;
	}

	updateProcessingStats(stats: Partial<ProcessingStats>) {
		this.processingStats = {
			...this.processingStats,
			...stats
		};
	}

	toggleSort(column: string) {
		if (this.sort.column === column) {
			if (this.sort.direction === 'asc') {
				this.sort = { column, direction: 'desc' };
			} else if (this.sort.direction === 'desc') {
				this.sort = { column: null, direction: null };
			} else {
				this.sort = { column, direction: 'asc' };
			}
		} else {
			this.sort = { column, direction: 'asc' };
		}
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

	// Sort by multiple columns
	sort = $state<SortConfig[]>([]);

	// Remove the old toggleSort method and add these helper methods:
	addSort(column: string) {
		this.sort = [...this.sort, { column, direction: 'asc' }];
		if (this.selectedDatasetId) {
			UIStateService.getInstance().setColumnState(
				this.selectedDatasetId,
				Array.from(this.selectedColumns),
				this.columnOrder,
				this.columnWidths,
				this.sort
			);
		}
	}

	updateSort(column: string, direction: 'asc' | 'desc') {
		this.sort = this.sort.map((s) => (s.column === column ? { ...s, direction } : s));
		if (this.selectedDatasetId) {
			UIStateService.getInstance().setColumnState(
				this.selectedDatasetId,
				Array.from(this.selectedColumns),
				this.columnOrder,
				this.columnWidths,
				this.sort
			);
		}
	}

	removeSort(column: string) {
		this.sort = this.sort.filter((s) => s.column !== column);
		if (this.selectedDatasetId) {
			UIStateService.getInstance().setColumnState(
				this.selectedDatasetId,
				Array.from(this.selectedColumns),
				this.columnOrder,
				this.columnWidths,
				this.sort
			);
		}
	}
}

export const dataTableStore = DataTableStore.getInstance();
