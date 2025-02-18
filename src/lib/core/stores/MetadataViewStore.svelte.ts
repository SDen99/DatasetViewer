import { StorageService } from '../services/StorageServices';
export class MetadataViewStore {
	private static instance: MetadataViewStore;
	private initialized = false;

	// Dataset-specific state
	metadataState = $state<
		Record<
			string,
			{
				expandedMethods: Set<string>;
				searchTerm: string;
			}
		>
	>({});

	private constructor() {
		// Setup persistence effect after initialization
		$effect.root(() => {
			$effect(() => {
				if (this.initialized) {
					StorageService.getInstance().saveState({
						metadataViews: this.metadataState
					});
				}
			});
		});

		// Load initial state
		const storage = StorageService.getInstance();
		const savedState = storage.loadState();
		if (savedState.metadataViews) {
			this.metadataState = savedState.metadataViews;
		}

		this.initialized = true;
	}

	static getInstance(): MetadataViewStore {
		if (!MetadataViewStore.instance) {
			MetadataViewStore.instance = new MetadataViewStore();
		}
		return MetadataViewStore.instance;
	}

	// State management methods
	getDatasetState(datasetId: string) {
		const existingState = this.metadataState[datasetId];

		if (!existingState) {
			// Return a fresh state object
			return {
				expandedMethods: new Set<string>(),
				searchTerm: ''
			};
		}

		// If expandedMethods exists but isn't a Set, create a new state object
		if (existingState.expandedMethods && !(existingState.expandedMethods instanceof Set)) {
			return {
				...existingState,
				expandedMethods: new Set(
					Array.isArray(existingState.expandedMethods) ? existingState.expandedMethods : []
				)
			};
		}

		// Return the existing state unmodified
		return existingState;
	}

	updateSearch(datasetId: string, term: string) {
		this.metadataState = {
			...this.metadataState,
			[datasetId]: {
				...this.getDatasetState(datasetId),
				searchTerm: term
			}
		};
	}

	toggleMethod(datasetId: string, methodKey: string) {
		const currentState = this.getDatasetState(datasetId);
		const newExpanded = new Set(currentState.expandedMethods);

		if (newExpanded.has(methodKey)) {
			newExpanded.delete(methodKey);
		} else {
			newExpanded.add(methodKey);
		}

		this.metadataState = {
			...this.metadataState,
			[datasetId]: {
				...currentState,
				expandedMethods: newExpanded
			}
		};
	}

	// Clean up dataset state
	clearDataset(datasetId: string) {
		const { [datasetId]: _, ...rest } = this.metadataState;
		this.metadataState = rest;
	}

	saveState() {
		const serializable = Object.fromEntries(
			Object.entries(this.metadataState).map(([key, value]) => [
				key,
				{
					...value,
					expandedMethods: Array.from(value.expandedMethods)
				}
			])
		);

		StorageService.getInstance().saveState({
			metadataViews: serializable
		});
	}

	// Reset all state
	reset() {
		this.metadataState = {};
	}
}

export const metadataViewStore = MetadataViewStore.getInstance();
