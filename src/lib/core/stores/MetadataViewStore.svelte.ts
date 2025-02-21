import { StorageService } from '../services/StorageServices';

// Import the types from StorageServices
import type { MetadataViewState, SerializedMetadataViewState } from '../services/StorageServices';

export class MetadataViewStore {
	private static instance: MetadataViewStore;
	private initialized = false;

	// Dataset-specific state using the MetadataViewState type
	metadataState = $state<Record<string, MetadataViewState>>({});

	private constructor() {
		// Setup persistence effect after initialization
		$effect.root(() => {
			$effect(() => {
				if (this.initialized) {
					this.saveState();
				}
			});
		});

		// Load initial state
		this.loadInitialState();
		this.initialized = true;
	}

	static getInstance(): MetadataViewStore {
		if (!MetadataViewStore.instance) {
			MetadataViewStore.instance = new MetadataViewStore();
		}
		return MetadataViewStore.instance;
	}

	private loadInitialState(): void {
		const storage = StorageService.getInstance();
		const savedState = storage.loadState();

		if (savedState.metadataViews) {
			// Convert serialized arrays to Sets
			this.metadataState = Object.fromEntries(
				Object.entries(savedState.metadataViews).map(([key, value]) => [
					key,
					{
						...value,
						expansions: new Set(value.expansions)
					}
				])
			);
		}
	}

	private saveState(): void {
		// Convert Sets to arrays for storage
		const serializable: Record<string, SerializedMetadataViewState> = Object.fromEntries(
			Object.entries(this.metadataState).map(([key, value]) => [
				key,
				{
					...value,
					expansions: Array.from(value.expansions)
				}
			])
		);

		StorageService.getInstance().saveState({
			metadataViews: serializable
		});
	}

	getDatasetState(datasetId: string): MetadataViewState {
		return (
			this.metadataState[datasetId] || {
				expansions: new Set<string>(),
				searchTerm: ''
			}
		);
	}

	updateSearch(datasetId: string, term: string): void {
		this.metadataState = {
			...this.metadataState,
			[datasetId]: {
				...this.getDatasetState(datasetId),
				searchTerm: term
			}
		};
	}

	toggleExpansion(datasetId: string, expansionKey: string): void {
		const currentState = this.getDatasetState(datasetId);
		const newExpanded = new Set(currentState.expansions);

		if (newExpanded.has(expansionKey)) {
			newExpanded.delete(expansionKey);
		} else {
			newExpanded.add(expansionKey);
		}

		this.metadataState = {
			...this.metadataState,
			[datasetId]: {
				...currentState,
				expansions: newExpanded
			}
		};
	}

	expandAll(datasetId: string, expansionKeys: string[]): void {
		const currentState = this.getDatasetState(datasetId);

		this.metadataState = {
			...this.metadataState,
			[datasetId]: {
				...currentState,
				expansions: new Set(expansionKeys)
			}
		};
	}

	collapseAll(datasetId: string): void {
		const currentState = this.getDatasetState(datasetId);

		this.metadataState = {
			...this.metadataState,
			[datasetId]: {
				...currentState,
				expansions: new Set()
			}
		};
	}

	clearDataset(datasetId: string): void {
		const { [datasetId]: _, ...rest } = this.metadataState;
		this.metadataState = rest;
	}

	reset(): void {
		this.metadataState = {};
	}
}

export const metadataViewStore = MetadataViewStore.getInstance();
