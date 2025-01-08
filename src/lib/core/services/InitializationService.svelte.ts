import { errorStore, ErrorSeverity } from '$lib/core/stores/errorStore';
import { storeCoordinator } from '$lib/core/stores/storeCoordinator.svelte';
import { datasetStore } from '$lib/core/stores/datasetStore.svelte';
import { tableUIStore } from '$lib/core/stores/tableUIStore.svelte';
import { sortStore } from '$lib/core/stores/sortStore.svelte';
import type { InitState } from '$lib/core/types';
import { ServiceContainer } from '$lib/core/stores/serviceContainer';
import type { ServiceContainer as ServiceContainerType } from '$lib/core/types';

export class InitializationManager {
	status = $state<InitState>({
		status: 'idle',
		container: null,
		progress: null
	});

	async initialize() {
		if (this.status.status === 'initializing') return;

		try {
			console.log('🟡 Starting initialization...');
			await this.beginInitialization();

			console.log('🟡 Initializing services...');
			const container = await this.initializeServices();

			console.log('🟡 Initializing stores...');
			await this.initializeStores(container);

			console.log('🟡 Restoring state...');
			await this.restoreState(container);

			console.log('🟢 Completing initialization...');
			this.completeInitialization(container);
		} catch (error) {
			console.error('🔴 Initialization failed:', error);
			this.handleInitializationError(error);
			throw error;
		}
	}

	private async beginInitialization() {
		this.status = {
			...this.status,
			status: 'initializing',
			progress: {
				step: 'services',
				message: 'Starting initialization...'
			}
		};
	}

	private async initializeServices() {
		this.updateProgress('services', 'Initializing service container...');
		try {
			const container = await ServiceContainer.initialize();
			if (!container) {
				console.error('🔴 ServiceContainer.initialize() returned null/undefined');
				throw new Error('Failed to initialize service container - no container returned');
			}
			return container;
		} catch (error) {
			console.error('🔴 Error initializing services:', error);
			throw error; // Re-throw to be caught by the main initialize() method
		}
	}

	private async initializeStores(container: ServiceContainerType) {
		this.updateProgress('dataset', 'Loading datasets...');

		// Initialize dataset store
		const datasetService = container.getDatasetService();
		const datasets = await datasetService.getAllDatasets();
		datasetStore.setDatasets(datasets);

		// Reset other stores to known state
		tableUIStore.reset();
		sortStore.reset();
	}

	private async restoreState(container: ServiceContainerType) {
		this.updateProgress('ui', 'Restoring application state...');

		const uiService = container.getUIStateService();
		uiService.initStorageSync();

		// Get selected dataset from UI state
		const selectedId = uiService.getSelectedDataset();

		// Use StoreCoordinator to restore state
		if (selectedId && datasetStore.datasets[selectedId]) {
			storeCoordinator.selectDataset(selectedId);
		}
	}

	private completeInitialization(container: ServiceContainerType) {
		console.log('Complete initialization called with container:', container);
		if (!container) {
			throw new Error('Attempting to complete initialization with null container');
		}

		this.status = {
			status: 'ready',
			container,
			progress: null
		};
	}

	private handleInitializationError(error: unknown) {
		console.error('🔴 Detailed initialization error:', error);
		if (error instanceof Error) {
			console.error('Stack trace:', error.stack);
		}

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
	}

	private updateProgress(step: 'services' | 'dataset' | 'ui', message: string) {
		this.status.progress = { step, message };
	}

	reset() {
		this.status = {
			status: 'idle',
			container: null,
			progress: null
		};
	}
}

export const initManager = new InitializationManager();
