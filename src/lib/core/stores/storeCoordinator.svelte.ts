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
			$effect(() => {
				// Get the current state from datasetStore
				const { SDTM, ADaM } = datasetStore.defineXmlDatasets;

				// Sync with UIStore
				UIStore.getInstance().setDefineXMLType(Boolean(SDTM), Boolean(ADaM));
			});
		});
	}

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
					// Use details.columns if available, otherwise try to get from first row
					const columns = foundDataset.details?.columns || Object.keys(foundDataset.data[0]);
					if (columns?.length) {
						tableUIStore.initialize(columns);
						// Also set column order explicitly
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
			storage.saveState({ lastSelectedDataset: null });
		}
	}

	private batchUpdate(fn: () => void) {
		untrack(fn); // Changed from $effect.untrack
	}

	selectDataset(id: string | null) {
		this.batchUpdate(() => {
			if (id === null) {
				datasetStore.selectedDatasetId = null;
				tableUIStore.reset();
				sortStore.reset();
				return;
			}

			const normalizedId = normalizeDatasetId(id);
			const originalId = datasetStore.getOriginalFilename(normalizedId) || id;
			const dataset = datasetStore.datasets[originalId];
			const hasData = !!dataset?.data;
			const hasMetadata = this.hasMetadataForDataset(normalizedId);

			// Set dataset ID first
			datasetStore.selectedDatasetId = originalId;

			if (hasData) {
				// Batch data-related updates
				this.setDataset(originalId, datasetStore.datasets, datasetStore.defineXmlDatasets);
				const uiStore = UIStore.getInstance();
				uiStore.uiState = {
					...uiStore.uiState,
					viewMode: 'data',
					rightSidebarOpen: true
				};
			} else if (hasMetadata) {
				const defineData = datasetStore.defineXmlDatasets;
				const metadata = this.getMetadataForDataset(normalizedId, defineData);

				if (metadata) {
					// Batch metadata-related updates
					const define = metadata.Name?.includes('AD') ? defineData.ADaM : defineData.SDTM;
					const variables = this.getVariablesForDataset(normalizedId, define);

					tableUIStore.initialize(variables);
					const uiStore = UIStore.getInstance();
					uiStore.uiState = {
						...uiStore.uiState,
						viewMode: 'metadata',
						rightSidebarOpen: false
					};
				}
				sortStore.reset();
			}
		});
	}

	// Helper methods to keep the code organized
	private getMetadataForDataset(normalizedId: string, defineData: any) {
		return (
			defineData.SDTM?.itemGroups.find((g: any) => normalizeDatasetId(g.Name!) === normalizedId) ||
			defineData.ADaM?.itemGroups.find((g: any) => normalizeDatasetId(g.Name!) === normalizedId)
		);
	}

	private getVariablesForDataset(normalizedId: string, define: any) {
		return (
			define?.itemDefs
				.filter((item: any) => normalizeDatasetId(item.Dataset!) === normalizedId)
				.map((v: any) => v.Name!)
				.filter((name: any): name is string => name != null) || []
		);
	}

	private hasMetadataForDataset(normalizedName: string): boolean {
		const { SDTM, ADaM } = datasetStore.defineXmlDatasets;
		return !!(
			SDTM?.itemGroups?.some((g) => normalizeDatasetId(g.Name!) === normalizedName) ||
			ADaM?.itemGroups?.some((g) => normalizeDatasetId(g.Name!) === normalizedName)
		);
	}

	updateDefineXMLStatus(hasSDTM: boolean, hasADaM: boolean) {
		UIStore.getInstance().setDefineXMLType(hasSDTM, hasADaM);
	}
}

export const storeCoordinator = StoreCoordinator.getInstance();
