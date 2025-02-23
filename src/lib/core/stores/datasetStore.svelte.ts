import type { Dataset, DatasetLoadingState, ProcessingStats } from '$lib/core/types/types';
import { DatasetService } from '$lib/core/services/datasetService';
import { tableUIStore } from '$lib/core/stores//tableUIStore.svelte';
import { sortStore } from '$lib/core/stores/sortStore.svelte';
import { StorageService } from '$lib/core/services/StorageServices';
import { storeCoordinator } from './storeCoordinator.svelte';
import type { ParsedDefineXML } from '$lib/types/define-xml';
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
			const normalizedId = normalizeDatasetId(id);
			console.log('🟡 Starting deletion for:', id, 'normalized:', normalizedId);

			// First, get all matching dataset IDs
			const matchingIds = Object.keys(this.datasets).filter(
				(key) => normalizeDatasetId(key) === normalizedId
			);
			console.log('🟡 Found matching datasets:', matchingIds);

			// Delete from IndexedDB first
			const datasetService = DatasetService.getInstance();
			await Promise.all(
				matchingIds.map(async (datasetId) => {
					console.log('🟡 Deleting from IndexedDB:', datasetId);
					await datasetService.removeDataset(datasetId);
				})
			);
			console.log('🟢 IndexedDB deletion complete');

			// Update local state
			const newDatasets = { ...this.datasets };
			matchingIds.forEach((datasetId) => {
				console.log('🟡 Removing from local state:', datasetId);
				delete newDatasets[datasetId];
			});
			this.datasets = newDatasets;

			// Remove from filename mappings
			const newFilenames = { ...this.originalFilenames };
			delete newFilenames[normalizedId];
			this.originalFilenames = newFilenames;

			// Clear storage state
			const storage = StorageService.getInstance();
			const state = storage.loadState();

			// Remove all views for matching datasets
			const remainingViews = Object.entries(state.datasetViews)
				.filter(([key]) => !matchingIds.includes(key))
				.reduce((acc, [key, value]) => ({ ...acc, [key]: value }), {});

			await storage.saveState({ datasetViews: remainingViews });

			// Update selection if needed
			if (this.selectedDatasetId && normalizedId === normalizeDatasetId(this.selectedDatasetId)) {
				this.selectDataset(null);
				tableUIStore.reset();
				sortStore.reset();
			}

			// Force a refresh of derived states
			this.datasets = { ...this.datasets };

			console.log('🟢 Deletion complete, final datasets:', this.datasets);
			return true;
		} catch (error) {
			console.error('🔴 Error during dataset deletion:', error);
			throw error;
		}
	}

	isDefineXML(data: unknown): data is ParsedDefineXML {
		return typeof data === 'object' && data !== null && 'MetaData' in data && 'ItemGroups' in data;
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
			if (dataset.data && this.isDefineXML(dataset.data)) {
				defineXmlFiles[fileName] = dataset.data;
			}
		}

		return {
			SDTM: Object.values(defineXmlFiles).find((d) => d.MetaData.OID?.includes('SDTM')) ?? null,
			ADaM: Object.values(defineXmlFiles).find((d) => d.MetaData.OID?.includes('ADaM')) ?? null
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

	getDatasetState(name: string) {
		const normalizedName = normalizeDatasetId(name);

		// Find dataset if it exists
		const dataset = Object.entries(this.datasets).find(
			([dataName]) => normalizeDatasetId(dataName) === normalizedName
		)?.[1];

		// Check loading state
		const loadingDataset = Object.entries(this.loadingDatasets).find(
			([loadingName]) => normalizeDatasetId(loadingName) === normalizedName
		);

		// Check metadata existence
		const hasMetadata = Boolean(
			this.defineXmlDatasets.SDTM?.ItemGroups?.find(
				(g) => normalizeDatasetId(g.SASDatasetName || g.Name || '') === normalizedName
			) ||
				this.defineXmlDatasets.ADaM?.ItemGroups?.find(
					(g) => normalizeDatasetId(g.SASDatasetName || g.Name || '') === normalizedName
				)
		);

		// More specific check for data existence
		const hasData = Boolean(
			dataset?.data &&
				Array.isArray(dataset.data) &&
				dataset.data.length > 0 &&
				dataset.details?.columns?.length > 0
		);

		return {
			hasData,
			hasMetadata,
			isLoading: Boolean(loadingDataset),
			error: loadingDataset?.[1]?.status === 'error' ? loadingDataset[1].error : undefined,
			loadingProgress: loadingDataset?.[1]?.progress || 0
		};
	}

	availableDatasets = $derived.by(() => {
		const datasetSet = new Set<string>();
		const { SDTM, ADaM } = this.defineXmlDatasets;

		// Add from actual datasets
		Object.entries(this.datasets).forEach(([name, dataset]) => {
			// Check if it's not a Define.xml file
			const isDefineXml =
				dataset.data && typeof dataset.data === 'object' && 'MetaData' in dataset.data;

			if (!isDefineXml) {
				datasetSet.add(normalizeDatasetId(name));
			}
		});

		// Add from loading state
		Object.entries(this.loadingDatasets).forEach((name) =>
			datasetSet.add(normalizeDatasetId(name[0]))
		);

		// Add from Define.xml metadata
		SDTM?.ItemGroups?.forEach((group) => {
			const name = group.SASDatasetName || group.Name || '';
			if (name) datasetSet.add(normalizeDatasetId(name));
		});

		ADaM?.ItemGroups?.forEach((group) => {
			const name = group.SASDatasetName || group.Name || '';
			if (name) datasetSet.add(normalizeDatasetId(name));
		});

		return Array.from(datasetSet).sort();
	});
}

export const datasetStore = DatasetStore.getInstance();
