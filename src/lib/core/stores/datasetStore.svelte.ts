import type { Dataset, DatasetLoadingState, ProcessingStats } from '$lib/core/types/types';
import { DatasetService } from '$lib/core/services/datasetService';
import { tableUIStore } from '$lib/core/stores//tableUIStore.svelte';
import { sortStore } from '$lib/core/stores/sortStore.svelte';
import { StorageService } from '$lib/core/services/StorageServices';
import { storeCoordinator } from './storeCoordinator.svelte';
import type { ParsedDefineXML } from '$lib/core/processors/defineXML/types';
import { normalizeDatasetId } from '../utils/datasetUtils';
export class DatasetStore {
	private static instance: DatasetStore | null = null;
	datasets = $state<Record<string, Dataset>>({});
	selectedDatasetId = $state<string | null>(null);
	isLoading = $state(false);
	loadingDatasets = $state<Record<string, DatasetLoadingState>>({});
	originalFilenames = $state<Record<string, string>>({}); // normalized -> original

	processingStats = $state<ProcessingStats>({
		uploadTime: null,
		numColumns: null,
		numRows: null,
		datasetSize: null
	});

	private constructor() {
		$effect.root(() => {
			const storage = StorageService.getInstance();
			const state = storage.loadState();
			if (state.lastSelectedDataset && this.datasets[state.lastSelectedDataset]) {
				this.selectDataset(state.lastSelectedDataset);
			}
		});
	}

	persistSelectedDataset = $effect.root(() => {
		$effect(() => {
			if (this.selectedDatasetId) {
				StorageService.getInstance().saveState({
					lastSelectedDataset: this.selectedDatasetId
				});
			}
		});
	});

	async deleteDataset(id: string) {
		try {
			const datasetService = DatasetService.getInstance();
			await datasetService.removeDataset(id);

			// Update local state
			const newDatasets = { ...this.datasets };
			delete newDatasets[id];
			this.datasets = newDatasets;

			// Remove from filename mappings
			const normalizedId = normalizeDatasetId(id);
			const newFilenames = { ...this.originalFilenames };
			delete newFilenames[normalizedId];
			this.originalFilenames = newFilenames;

			// Clear storage state for deleted dataset
			const storage = StorageService.getInstance();
			const state = storage.loadState();
			const { [id]: _, ...remainingViews } = state.datasetViews;
			storage.saveState({ datasetViews: remainingViews });

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

		// Update filename mappings
		Object.keys(newDatasets).forEach((filename) => {
			const normalizedId = normalizeDatasetId(filename);
			this.originalFilenames[normalizedId] = filename;
		});

		// Auto-select first dataset if none selected
		if (!this.selectedDatasetId && Object.keys(newDatasets).length > 0) {
			const firstId = Object.keys(newDatasets)[0];
			this.selectedDatasetId = firstId;
		}
	}

	// Simplified selectDataset - coordination handled by StoreCoordinator effect
	selectDataset(id: string | null) {
		if (id) {
			const normalizedId = normalizeDatasetId(id);
			this.originalFilenames[normalizedId] = id;
		}
		this.selectedDatasetId = id;
	}

	getOriginalFilename(normalizedId: string): string | undefined {
		return this.originalFilenames[normalizedId];
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
			SDTM: Object.values(defineXmlFiles).find((d) => d.metaData.OID?.includes('SDTM')) ?? null,
			ADaM: Object.values(defineXmlFiles).find((d) => d.metaData.OID?.includes('ADaM')) ?? null
		};
	});

	datasetAssociations = $derived.by(() => {
		const associations: Record<string, { type: 'SDTM' | 'ADaM'; defineId: string }> = {};

		Object.entries(this.datasets).forEach(([id, dataset]) => {
			if (dataset.defineAssociation) {
				associations[normalizeDatasetId(id)] = {
					type: dataset.defineAssociation.type,
					defineId: dataset.defineAssociation.defineId
				};
			}
		});

		return associations;
	});

	// New methods for handling associations
	async associateWithDefine(datasetId: string, defineType: 'SDTM' | 'ADaM', defineId: string) {
		const dataset = this.datasets[datasetId];
		if (dataset) {
			const updatedDataset = {
				...dataset,
				defineAssociation: {
					type: defineType,
					defineId,
					timestamp: Date.now()
				}
			};

			await DatasetService.getInstance().addDataset(updatedDataset);
			this.datasets = {
				...this.datasets,
				[datasetId]: updatedDataset
			};
		}
	}

	async removeDefineAssociations(defineId: string) {
		const updates = Object.entries(this.datasets)
			.filter(([_, dataset]) => dataset.defineAssociation?.defineId === defineId)
			.map(async ([id, dataset]) => {
				const { defineAssociation, ...rest } = dataset;
				const updatedDataset = { ...rest };
				await DatasetService.getInstance().addDataset(updatedDataset);
				return [id, updatedDataset];
			});

		const updatedDatasets = await Promise.all(updates);
		this.datasets = {
			...this.datasets,
			...Object.fromEntries(updatedDatasets)
		};
	}
}

export const datasetStore = DatasetStore.getInstance();
