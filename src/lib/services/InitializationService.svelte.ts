import { ServiceContainer } from '$lib/stores/serviceContainer';
import { errorStore, ErrorSeverity } from '$lib/stores/errorStore';
import { datasetStore } from '$lib/stores/datasetStore.svelte';

export type InitState = {
	status: 'idle' | 'initializing' | 'ready' | 'error';
	container: ServiceContainer | null;
	error?: Error;
	progress: {
		step: 'services' | 'dataset' | 'ui' | 'workers';
		message: string;
	} | null;
};

export class InitializationManager {
	status = $state<InitState>({
		status: 'idle',
		container: null,
		progress: null
	});

	async initialize() {
		if (this.status.status === 'initializing') return;

		this.status = {
			...this.status,
			status: 'initializing',
			progress: {
				step: 'services',
				message: 'Initializing core services...'
			}
		};

		try {
			// Initialize services
			this.status.progress = {
				step: 'services',
				message: 'Initializing service container...'
			};
			const container = await ServiceContainer.initialize();

			// Load initial dataset state
			this.status.progress = {
				step: 'dataset',
				message: 'Loading dataset service...'
			};
			const datasetService = container.getDatasetService();
			const datasets = await datasetService.getAllDatasets();

			// Update dataTableStore with datasets
			datasetStore.setDatasets(datasets);

			// Initialize UI state and restore selected dataset if any
			this.status.progress = {
				step: 'ui',
				message: 'Restoring UI state...'
			};
			const uiService = container.getUIStateService();
			uiService.initStorageSync();

			const selectedId = uiService.getSelectedDataset();
			if (selectedId && datasets[selectedId]) {
				await datasetStore.selectDataset(selectedId);
			}

			// Final setup
			this.status = {
				status: 'ready',
				container,
				progress: null
			};

			return container;
		} catch (error) {
			const err = error instanceof Error ? error : new Error('Unknown initialization error');

			this.status = {
				status: 'error',
				container: null,
				error: err,
				progress: null
			};

			errorStore.addError({
				message: 'Failed to initialize application services',
				severity: ErrorSeverity.ERROR,
				context: { error: err }
			});

			throw err;
		}
	}

	reset() {
		this.status = {
			status: 'idle',
			container: null,
			progress: null
		};
	}
}

// Create a singleton instance
export const initManager = new InitializationManager();
