import { DatasetService } from '../../datasetService';
import { UIStateService } from '../../UIStateService';
import { createWorkerPool } from '../../workerPool';
import { WorkerPool } from '../../workerPool';
import type { BrowserWindow } from '$lib/types';

export class ServiceContainer {
	private static instance: ServiceContainer | null = null;
	private datasetService: DatasetService | null = null;
	private uiStateService: UIStateService | null = null;
	private workerPool: WorkerPool | null = null;

	private constructor() {}

	public static async initialize(): Promise<ServiceContainer> {
		if (!ServiceContainer.instance) {
			const container = new ServiceContainer();

			try {
				// Initialize services in correct order
				container.datasetService = DatasetService.getInstance();
				await container.datasetService.initialize();

				container.uiStateService = UIStateService.getInstance();

				container.workerPool = createWorkerPool();
				if (container.workerPool) {
					await container.workerPool.initialize();
				}

				ServiceContainer.instance = container;
			} catch (error) {
				console.error('Failed to initialize services:', error);
				throw error;
			}
		}
		return ServiceContainer.instance;
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
		}
	}
}
