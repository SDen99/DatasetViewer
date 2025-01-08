import { DatasetService } from '../../datasetService';
import { UIStateService } from '../../UIStateService';
import { createWorkerPool } from '../../workerPool';
import { WorkerPool } from '../../workerPool';
import type { ServiceContainer as ServiceContainerType } from '$lib/types';

export class ServiceContainerImpl implements ServiceContainerType {
	private static instance: ServiceContainerImpl | null = null;
	private datasetService: DatasetService | null = null;
	private isDisposed: boolean = false;
	private uiStateService: UIStateService | null = null;
	private workerPool: WorkerPool | null = null;

	private constructor() {}

	public static async initialize(): Promise<ServiceContainerImpl> {
		console.log('🟡 ServiceContainer.initialize() started');
		if (!ServiceContainerImpl.instance) {
			console.log('🟡 Creating new ServiceContainer instance');
			const container = new ServiceContainerImpl();

			try {
				console.log('🟡 Initializing dataset service...');
				container.datasetService = DatasetService.getInstance();
				await container.datasetService.initialize();
				console.log('🟢 Dataset service initialized');

				console.log('🟡 Initializing UI state service...');
				container.uiStateService = UIStateService.getInstance();
				console.log('🟢 UI state service initialized');

				console.log('🟡 Initializing worker pool...');
				container.workerPool = createWorkerPool();
				if (container.workerPool) {
					await container.workerPool.initialize();
					console.log('🟢 Worker pool initialized');
				} else {
					console.error('🔴 Failed to create worker pool');
				}

				console.log('🟡 Setting ServiceContainer.instance');

				if (!container.datasetService) {
					throw new Error('Dataset service failed to initialize');
				}
				if (!container.uiStateService) {
					throw new Error('UI state service failed to initialize');
				}
				if (!container.workerPool) {
					throw new Error('Worker pool failed to initialize');
				}

				ServiceContainerImpl.instance = container;
				console.log('🟢 ServiceContainer initialization complete');
				return ServiceContainerImpl.instance;
			} catch (error) {
				console.error('🔴 Error during ServiceContainer initialization:', error);
				throw error;
			}
		}
		console.log('🟢 Returning existing ServiceContainer instance');
		return ServiceContainerImpl.instance;
	}

	private clearSubscriptions(): void {
		// Clear any subscriptions
	}

	public getWorkerPool(): WorkerPool {
		this.throwIfDisposed();
		if (!this.workerPool) {
			throw new Error('Worker pool not initialized');
		}
		return this.workerPool;
	}

	public getDatasetService(): DatasetService {
		this.throwIfDisposed();
		if (!this.datasetService) {
			throw new Error('Dataset service not initialized');
		}
		return this.datasetService;
	}

	public getUIStateService(): UIStateService {
		this.throwIfDisposed();
		if (!this.uiStateService) {
			throw new Error('UI state service not initialized');
		}
		return this.uiStateService;
	}

	private throwIfDisposed(): void {
		if (this.isDisposed) {
			throw new Error('Service container has been disposed');
		}
	}

	public dispose(): void {
		if (this.isDisposed) {
			return;
		}
		/*
		try {
			// Terminate worker pool
			if (this.workerPool) {
				this.workerPool.terminate();
				this.workerPool = null;
			}

			// Clean up dataset service
			if (this.datasetService) {
				this.datasetService.dispose();
				this.datasetService = null;
			}

			// Clean up UI state service
			if (this.uiStateService) {
				this.uiStateService.dispose();
				this.uiStateService = null;
			}

			// Clear any event listeners or subscriptions
			this.clearSubscriptions();
		} catch (error) {
			console.error('Error during service container disposal:', error);
		} finally {
			this.isDisposed = true;
		} */
	}
}

export { ServiceContainerImpl as ServiceContainer };
