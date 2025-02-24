import { tableUIStore } from './tableUIStore.svelte';
import { sortStore } from './sortStore.svelte';
import { findDatasetByName, normalizeDatasetId } from '$lib/core/utils/datasetUtils';
import { StorageService } from '$lib/core/services/StorageServices';
import { datasetStore } from './datasetStore.svelte';
import { UIStore } from './UIStore.svelte';
import { untrack } from 'svelte';
import { vlmStore } from '$lib/core/stores/VLMStore.svelte';

export class StoreCoordinator {
	private static instance: StoreCoordinator;
	lastSavedState = $state<{
		datasetId: string;
		timestamp: number;
	} | null>(null);

	private constructor() {
		// Initialize effects in constructor
		$effect.root(() => {
			// Monitor Define XML status
			$effect(() => {
				const { SDTM, ADaM } = untrack(() => datasetStore.defineXmlDatasets);
				UIStore.getInstance().setDefineXMLType(Boolean(SDTM), Boolean(ADaM));
			});

			// New effect to handle dataset selection and coordination
			$effect(() => {
				const id = datasetStore.selectedDatasetId;
				const datasets = datasetStore.datasets;
				const defineXmlDatasets = datasetStore.defineXmlDatasets;

				if (id) {
					const foundDataset = findDatasetByName(datasets, id, defineXmlDatasets);
					if (!foundDataset) return;

					const actualId = foundDataset.fileName;
					const storage = StorageService.getInstance();
					const state = storage.loadState();
					const datasetState = state.datasetViews[actualId];

					if (!foundDataset.isMetadataOnly) {
						if (datasetState) {
							tableUIStore.restore({
								selectedColumns: datasetState.selectedColumns,
								columnOrder: datasetState.columnOrder,
								columnWidths: datasetState.columnWidths
							});
							sortStore.restore(datasetState.sort);
						} else if (foundDataset.data?.[0]) {
							const columns = foundDataset.details?.columns || Object.keys(foundDataset.data[0]);
							if (columns?.length) {
								tableUIStore.initialize(columns);
								tableUIStore.updateColumnOrder(columns);
								sortStore.reset();
							}
						}
					} else {
						tableUIStore.reset();
						sortStore.reset();
					}

					storage.saveState({ lastSelectedDataset: actualId });
				} else {
					tableUIStore.reset();
					sortStore.reset();
					StorageService.getInstance().saveState({ lastSelectedDataset: null });
				}
			});
		});
	}

	static getInstance(): StoreCoordinator {
		if (!StoreCoordinator.instance) {
			StoreCoordinator.instance = new StoreCoordinator();
		}
		return StoreCoordinator.instance;
	}

	selectDataset(id: string | null) {
		if (id === null) {
			datasetStore.selectedDatasetId = null;
			return;
		}

		const normalizedId = normalizeDatasetId(id);

		// First try to find the dataset with data
		const datasetKeys = Object.keys(datasetStore.datasets);
		const matchingKey = datasetKeys.find((key) => normalizeDatasetId(key) === normalizedId);

		// If we found a matching dataset with data, use its full filename
		if (matchingKey) {
			datasetStore.selectedDatasetId = matchingKey;
		} else {
			// Otherwise use the original id for metadata-only datasets
			datasetStore.selectedDatasetId = id;
		}
	}

	updateDefineXMLStatus(hasSDTM: boolean, hasADaM: boolean) {
		UIStore.getInstance().setDefineXMLType(hasSDTM, hasADaM);
	}

	private handleVLMState(actualId: string, displayData: { columns?: string[] }) {
		const storage = StorageService.getInstance();
		const state = storage.loadState();
		const vlmState = state.vlmViews?.[actualId];

		if (vlmState && displayData.columns) {
			vlmStore.initialize(actualId, displayData.columns);
			// Restore saved state
			if (vlmState.columnWidths) {
				Object.entries(vlmState.columnWidths).forEach(([col, width]) => {
					vlmStore.updateColumnWidth(actualId, col, Number(width));
				});
			}
			if (vlmState.columnOrder) {
				vlmStore.updateColumnOrder(actualId, vlmState.columnOrder);
			}
		} else if (displayData.columns) {
			// Initialize with default values
			vlmStore.initialize(actualId, displayData.columns);
		} else {
			vlmStore.reset(actualId);
		}
	}
}

export const storeCoordinator = StoreCoordinator.getInstance();
