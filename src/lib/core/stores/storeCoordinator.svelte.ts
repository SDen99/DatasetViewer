import { tableUIStore } from './tableUIStore.svelte';
import { sortStore } from './sortStore.svelte';
import { findDatasetByName, normalizeDatasetId } from '$lib/core/utils/datasetUtils';
import { StorageService } from '$lib/core/services/StorageServices';
import { datasetStore } from './datasetStore.svelte';
import { UIStore } from './UIStore.svelte';
import { untrack } from 'svelte';

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
				const { SDTM, ADaM } = datasetStore.defineXmlDatasets;
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
		const originalId = datasetStore.getOriginalFilename(normalizedId) || id;
		datasetStore.selectedDatasetId = originalId;
	}

	updateDefineXMLStatus(hasSDTM: boolean, hasADaM: boolean) {
		UIStore.getInstance().setDefineXMLType(hasSDTM, hasADaM);
	}
}

export const storeCoordinator = StoreCoordinator.getInstance();
