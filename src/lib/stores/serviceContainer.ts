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

    public getDatasetService(): DatasetService {
        if (!this.datasetService) {
            throw new Error('DatasetService not initialized');
        }
        return this.datasetService;
    }

    public getUIStateService(): UIStateService {
        if (!this.uiStateService) {
            throw new Error('UIStateService not initialized');
        }
        return this.uiStateService;
    }

    public getWorkerPool(): WorkerPool | null {
        return this.workerPool;
    }
}