import type { Dataset, DatasetLoadingState, ProcessingStats } from '$lib/core/types/types';
import { DatasetService } from '$lib/core/services/datasetService';
import { tableUIStore } from './tableUIStore.svelte';
import { sortStore } from './sortStore.svelte';
import { storeCoordinator } from './storeCoordinator.svelte';
import type { ParsedDefineXML } from '$lib/core/processors/defineXML/types';

export class DatasetStore {
	private static instance: DatasetStore;

	// State
	datasets = $state<Record<string, Dataset>>({});
	selectedDatasetId = $state<string | null>(null);
	isLoading = $state(false);
	loadingDatasets = $state<Record<string, DatasetLoadingState>>({});

	constructor() {
		// Create an effect root for store initialization
		$effect.root(() => {
			// Create effect to track and log dataset changes
			$effect(() => {
				$inspect('[DatasetStore] Datasets updated:', this.datasets);
				$inspect('[DatasetStore] Selected dataset:', this.selectedDatasetId);
				$inspect('[DatasetStore] Define XML datasets:', this.defineXmlDatasets);
			});
		});
	}

	processingStats = $state<ProcessingStats>({
		uploadTime: null,
		numColumns: null,
		numRows: null,
		datasetSize: null
	});

	updateProcessingStats(stats: Partial<ProcessingStats>) {
		// More defensive update
		this.processingStats = {
			...this.processingStats,
			...Object.fromEntries(Object.entries(stats).filter(([_, value]) => value !== undefined))
		};
	}

	static getInstance(): DatasetStore {
		if (!DatasetStore.instance) {
			DatasetStore.instance = new DatasetStore();
		}
		return DatasetStore.instance;
	}

	setDatasets(newDatasets: Record<string, Dataset>) {
		console.log('[DatasetStore] Setting datasets:', Object.keys(newDatasets));
		this.datasets = newDatasets;

		// Only auto-select if we don't have a current selection
		if (!this.selectedDatasetId && Object.keys(newDatasets).length > 0) {
			this.selectDataset(Object.keys(newDatasets)[0]);
		}
	}

	selectDataset(id: string | null) {
		storeCoordinator.selectDataset(id);
	}

	async deleteDataset(id: string) {
		try {
			// Remove from IndexedDB first
			const datasetService = DatasetService.getInstance();
			await datasetService.removeDataset(id);

			// Update local state
			const newDatasets = { ...this.datasets };
			delete newDatasets[id];
			this.datasets = newDatasets;

			// Clear UI state if needed
			if (this.selectedDatasetId === id) {
				this.selectDataset(null);
				tableUIStore.reset();
				sortStore.reset();
			}
		} catch (error) {
			console.error('Error deleting dataset:', error);
			throw error;
		}
	}

	setLoadingState(loading: boolean) {
		this.isLoading = loading;
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

	defineXmlDatasets = $derived.by(() => {
		const allDatasets = this.datasets;
		const defineXmlFiles: Record<string, ParsedDefineXML> = {};

		for (const [fileName, dataset] of Object.entries(allDatasets)) {
			// Type guard to ensure we have Define.xml data
			if (
				dataset.data &&
				typeof dataset.data === 'object' &&
				'metaData' in dataset.data &&
				'itemGroups' in dataset.data
			) {
				defineXmlFiles[fileName] = dataset.data as unknown as ParsedDefineXML;
			}
		}

		return {
			SDTM: Object.values(defineXmlFiles).find((d) => d.metaData.OID?.includes('SDTM')),
			ADaM: Object.values(defineXmlFiles).find((d) => d.metaData.OID?.includes('ADaM'))
		};
	});
}

export const datasetStore = DatasetStore.getInstance();
