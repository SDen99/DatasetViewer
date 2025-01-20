import { datasetStore } from './datasetStore.svelte';
import { tableUIStore } from './tableUIStore.svelte';
import { sortStore } from './sortStore.svelte';
import { uiStore } from './UIStore.svelte';
import { UIStateService } from '$lib/core/services/UIStateService';
import { normalizeDatasetId, findDatasetByName } from '$lib/core/utils/datasetUtils';

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

		if (prevId) {
			this.saveCurrentState(prevId);
		}

		if (id) {
			// Find dataset in both actual data and metadata
			const foundDataset = findDatasetByName(
				datasetStore.datasets,
				id,
				datasetStore.defineXmlDatasets
			);

			if (!foundDataset) {
				console.warn('Dataset not found:', id);
				return;
			}

			const actualId = foundDataset.fileName;

			const uiService = UIStateService.getInstance();
			const state = uiService.getColumnState(actualId);

			// Only restore/initialize UI state for datasets with actual data
			if (!foundDataset.isMetadataOnly) {
				if (uiService.hasColumnState(actualId)) {
					tableUIStore.restore({
						selectedColumns: state.selectedColumns,
						columnOrder: state.columnOrder,
						columnWidths: state.columnWidths
					});
					sortStore.restore(state.sort);
				} else if (foundDataset.data?.[0]) {
					const columns = Object.keys(foundDataset.data[0]);
					tableUIStore.initialize(columns);
					sortStore.reset();
				}
			} else {
				// Reset UI state for metadata-only datasets
				tableUIStore.reset();
				sortStore.reset();
			}

			// Update selection in datasetStore
			datasetStore.selectedDatasetId = actualId;
		} else {
			tableUIStore.reset();
			sortStore.reset();
			datasetStore.selectedDatasetId = null;
		}
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
