import { tableUIStore } from './tableUIStore.svelte';
import { sortStore } from './sortStore.svelte';
import { findDatasetByName, normalizeDatasetId } from '$lib/core/utils/datasetUtils';
import { StorageService } from '$lib/core/services/StorageServices';
import { datasetStore } from './datasetStore.svelte';
import { UIStore } from './UIStore.svelte';
import { untrack } from 'svelte';
import { vlmStore } from '$lib/core/stores/VLMStore.svelte';

interface DefineXMLData {
	MetaData: {
		OID: string;
	};
}

function isDefineXMLData(data: unknown): data is DefineXMLData {
	return (
		data !== null &&
		typeof data === 'object' &&
		'MetaData' in data &&
		typeof (data as any).MetaData?.OID === 'string'
	);
}

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

	selectDataset(id: string | null) {
		console.log('StoreCoordinator.selectDataset called with:', id);
	  
		if (id === null) {
		  datasetStore.selectDataset(null, null);
		  return;
		}
	  
		// Check if this ID is a dataset within Define XML files
		const { SDTM, ADaM } = datasetStore.defineXmlDatasets;
	  
		// Check if the id directly matches a dataset name in either Define XML
		const isInSDTM = SDTM?.ItemGroups?.some(
		  (g) => normalizeDatasetId(g.SASDatasetName || g.Name || '') === normalizeDatasetId(id)
		);
	  
		const isInADaM = ADaM?.ItemGroups?.some(
		  (g) => normalizeDatasetId(g.SASDatasetName || g.Name || '') === normalizeDatasetId(id)
		);
	  
		console.log('Name matching:', { id, isInSDTM, isInADaM });
	  
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
	  
		// First check if dataset exists directly in our storage
		const normalizedId = normalizeDatasetId(id);
		const datasetKeys = Object.keys(datasetStore.datasets);
		const matchingKey = datasetKeys.find((key) => normalizeDatasetId(key) === normalizedId);
		
		// Variables to determine final selection
		let selectedFileId = null;
		let selectedDomain = null;
		
		// If it exists directly as a dataset, select it
		if (matchingKey) {
		  console.log('Found actual dataset match:', matchingKey);
		  selectedFileId = matchingKey;
		}
		
		// If it's in ADaM, record that information (gives ADaM precedence over SDTM)
		if (isInADaM && adamFileName) {
		  console.log('Found in ADaM:', id);
		  // If we don't have a direct dataset match already, use the ADaM file
		  if (!selectedFileId) {
			selectedFileId = adamFileName;
		  }
		  selectedDomain = id; // Always track the domain for metadata
		}
		// If it's in SDTM and not already found in ADaM
		else if (isInSDTM && sdtmFileName && !selectedDomain) {
		  console.log('Found in SDTM:', id);
		  // If we don't have a direct dataset match already, use the SDTM file
		  if (!selectedFileId) {
			selectedFileId = sdtmFileName;
		  }
		  selectedDomain = id; // Always track the domain for metadata
		}
		
		// If we still don't have a file ID but were asked for one, use the original as a fallback
		if (!selectedFileId && id) {
		  selectedFileId = id;
		}
		
		// Make the selection
		console.log('Final selection:', { fileId: selectedFileId, domain: selectedDomain });
		datasetStore.selectDataset(selectedFileId, selectedDomain);
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
