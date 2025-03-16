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
				const { SDTM, ADaM } = datasetStore.defineXmlDatasets;
				UIStore.getInstance().setDefineXMLType(Boolean(SDTM), Boolean(ADaM));

				// For debugging
				console.log('Define XML status updated:', {
					hasSDTM: Boolean(SDTM),
					hasADaM: Boolean(ADaM)
				});
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

	selectDataset(id: string | null, domain: string | null = null) {
		console.log('StoreCoordinator.selectDataset called with:', { id, domain });

		if (id === null) {
			datasetStore.selectDataset(null, null);
			return;
		}

		// Check if this ID is a dataset within Define XML files
		const { SDTM, ADaM } = datasetStore.defineXmlDatasets;

		// If a domain was explicitly provided, use it with the given id
		if (domain) {
			console.log('Using explicitly provided domain:', domain);
			datasetStore.selectDataset(id, domain);
			return;
		}

		// Check if the id directly matches a dataset name in either Define XML
		const isInSDTM = SDTM?.ItemGroups?.some(
			(g) => (g.SASDatasetName || g.Name || '').toLowerCase() === id.toLowerCase()
		);

		const isInADaM = ADaM?.ItemGroups?.some(
			(g) => (g.SASDatasetName || g.Name || '').toLowerCase() === id.toLowerCase()
		);

		console.log('Direct name matching:', { id, isInSDTM, isInADaM });

		// Find Define.xml filenames
		const sdtmFileName = Object.entries(datasetStore.datasets).find(
			([_, dataset]) =>
				dataset.data &&
				typeof dataset.data === 'object' &&
				'MetaData' in dataset.data &&
				(dataset.data as any).MetaData.OID?.includes('SDTM')
		)?.[0];

		const adamFileName = Object.entries(datasetStore.datasets).find(
			([_, dataset]) =>
				dataset.data &&
				typeof dataset.data === 'object' &&
				'MetaData' in dataset.data &&
				(dataset.data as any).MetaData.OID?.includes('ADaM')
		)?.[0];

		// If it's a direct match in a Define XML, use that
		if (isInADaM && adamFileName) {
			console.log('Selecting ADaM Define.xml for domain:', id);
			datasetStore.selectDataset(adamFileName, id);
			return;
		}

		if (isInSDTM && sdtmFileName) {
			console.log('Selecting SDTM Define.xml for domain:', id);
			datasetStore.selectDataset(sdtmFileName, id);
			return;
		}

		// Fall back to standard normalized ID approach for other cases
		const normalizedId = normalizeDatasetId(id);
		console.log('Normalized ID (standard approach):', normalizedId);

		// Check if ID is an exact match for a dataset we have
		if (datasetStore.datasets[id]) {
			console.log('Found exact dataset match:', id);
			datasetStore.selectDataset(id, null);
			return;
		}

		// Try to find via normalized ID
		const datasetKeys = Object.keys(datasetStore.datasets);
		const matchingKey = datasetKeys.find((key) => normalizeDatasetId(key) === normalizedId);

		if (matchingKey) {
			console.log('Found normalized match:', matchingKey);
			datasetStore.selectDataset(matchingKey, null);
		} else {
			console.log('Using original ID (metadata-only):', id);
			datasetStore.selectDataset(id, null);
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
