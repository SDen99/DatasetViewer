import { datasetStore } from './datasetStore.svelte';
import { tableUIStore } from './tableUIStore.svelte';
import { sortStore } from './sortStore.svelte';
import { uiStore } from './UIStore.svelte';
import { UIStateService } from '$lib/core/services/UIStateService';

export class StoreCoordinator {
	private static instance: StoreCoordinator;

	// State tracking for performance optimization
	lastSavedState = $state<{
		datasetId: string;
		timestamp: number;
	} | null>(null);

	static getInstance(): StoreCoordinator {
		if (!StoreCoordinator.instance) {
			StoreCoordinator.instance = new StoreCoordinator();
		}
		return StoreCoordinator.instance;
	}

	private constructor() {
		// Keep existing constructor with state persistence effect
		$effect.root(() => {
			$effect(() => {
				const datasetId = datasetStore.selectedDatasetId;
				if (!datasetId) return;

				// Only save if we haven't recently saved this dataset
				if (
					!this.lastSavedState ||
					this.lastSavedState.datasetId !== datasetId ||
					Date.now() - this.lastSavedState.timestamp > 1000
				) {
					this.saveCurrentState(datasetId);
					this.lastSavedState = {
						datasetId,
						timestamp: Date.now()
					};
				}
			});
		});
	}

	selectDataset(id: string | null) {
		console.log('Select dataset called with:', id);
		const prevId = datasetStore.selectedDatasetId;
		console.log('Previous dataset:', prevId);

		if (id) {
			const dataset = datasetStore.datasets[id];
			console.log('Found dataset:', !!dataset);
			console.log('Dataset has data:', !!dataset?.data);
			console.log('First row:', dataset?.data?.[0]);
		}

		// Save previous state if exists
		if (prevId) {
			this.saveCurrentState(prevId);
		}

		// Load new state
		if (id) {
			const dataset = datasetStore.datasets[id];
			if (!dataset?.data?.[0]) {
				console.warn('Attempted to select invalid dataset:', id);
				return;
			}

			const uiService = UIStateService.getInstance();
			const state = uiService.getColumnState(id);

			if (uiService.hasColumnState(id)) {
				tableUIStore.restore({
					selectedColumns: state.selectedColumns,
					columnOrder: state.columnOrder,
					columnWidths: state.columnWidths
				});
				sortStore.restore(state.sort);
			} else {
				// Initialize with default settings
				const columns = Object.keys(dataset.data[0]);
				tableUIStore.initialize(columns);
				sortStore.reset();
			}
		} else {
			tableUIStore.reset();
			sortStore.reset();
		}

		// Update dataset selection last
		datasetStore.selectedDatasetId = id;
	}

	private saveCurrentState(datasetId: string) {
		// Save column state
		const state = {
			selectedColumns: Array.from(tableUIStore.selectedColumns),
			columnOrder: tableUIStore.columnOrder,
			columnWidths: tableUIStore.columnWidths,
			sort: sortStore.sort,
			ui: uiStore.uiState
		};

		// Save UI state
		const uiState = uiStore.getUIState();

		UIStateService.getInstance().setColumnState(
			datasetId,
			state.selectedColumns,
			state.columnOrder,
			state.columnWidths,
			state.sort
		);

		UIStateService.getInstance().setUIState(uiState);
	}
}

export const storeCoordinator = StoreCoordinator.getInstance();
