import { tableUIStore } from './tableUIStore.svelte';
import { sortStore } from './sortStore.svelte';
import { findDatasetByName } from '$lib/core/utils/datasetUtils';
import { StorageService } from '$lib/core/services/StorageServices';
import { datasetStore } from './datasetStore.svelte';
import { UIStore }	from './UIStore.svelte'

export class StoreCoordinator {
	private static instance: StoreCoordinator;
	lastSavedState = $state<{
		datasetId: string;
		timestamp: number;
	} | null>(null);

	private constructor() {}

	static getInstance(): StoreCoordinator {
		if (!StoreCoordinator.instance) {
			StoreCoordinator.instance = new StoreCoordinator();
		}
		return StoreCoordinator.instance;
	}

	setDataset(id: string | null, datasets: Record<string, any>, defineXmlDatasets: any) {
		const storage = StorageService.getInstance();

		if (id) {
			const foundDataset = findDatasetByName(datasets, id, defineXmlDatasets);
			if (!foundDataset) return;

			const actualId = foundDataset.fileName;
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
					const columns = Object.keys(foundDataset.data[0]);
					tableUIStore.initialize(columns);
					sortStore.reset();
				}
			} else {
				tableUIStore.reset();
				sortStore.reset();
			}

			storage.saveState({ lastSelectedDataset: actualId });
		} else {
			tableUIStore.reset();
			sortStore.reset();
			storage.saveState({ lastSelectedDataset: null });
		}
	}

	selectDataset(id: string | null) {
		datasetStore.selectedDatasetId = id;
		this.setDataset(id, datasetStore.datasets, datasetStore.defineXmlDatasets);
	  }

	  updateDefineXMLStatus(hasSDTM: boolean, hasADaM: boolean) {
		UIStore.getInstance().setDefineXMLType(hasSDTM, hasADaM);
	}
}

export const storeCoordinator = StoreCoordinator.getInstance();
