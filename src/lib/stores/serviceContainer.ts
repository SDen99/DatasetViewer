import { DatasetService } from '../../datasetService';
import { UIStateService } from '../../UIStateService';
import { WorkerPool } from '../../workerPool';
import type { BrowserWindow } from '$lib/types';

declare const window: BrowserWindow;

export class ServiceContainer {
    private static instance: ServiceContainer | null = null;
    private services: Map<string, any> = new Map();
    private initializationStatus: Map<string, Promise<void>> = new Map();

    private constructor() {}

    public static async initialize(options: {
        maxWorkers?: number;
        storagePrefix?: string;
    } = {}): Promise<ServiceContainer> {
        if (!ServiceContainer.instance) {
            const container = new ServiceContainer();
            
            try {
                // Initialize services with dependency order and error handling
                const datasetService = await container.initializeService(
                    'dataset',
                    async () => {
                        const service = new DatasetService();
                        await service.initialize();
                        return service;
                    }
                );

                const uiStateService = await container.initializeService(
                    'uiState',
                    async () => {
                        const service = new UIStateService();
                        service.initStorageSync(); // From our previous UIStateService improvements
                        return service;
                    }
                );

                const workerPool = await container.initializeService(
                    'workerPool',
                    async () => {
                        if (typeof window === 'undefined') return null;
                        const pool = new WorkerPool(options.maxWorkers);
                        await pool.initialize();
                        return pool;
                    }
                );

                ServiceContainer.instance = container;
            } catch (error) {
                // Cleanup on initialization failure
                await container.dispose();
                throw error;
            }
        }
        return ServiceContainer.instance;
    }

    private async initializeService<T>(
        name: string,
        factory: () => Promise<T>
    ): Promise<T> {
        try {
            const service = await factory();
            this.services.set(name, service);
            return service;
        } catch (error) {
            console.error(`Failed to initialize ${name} service:`, error);
            throw error;
        }
    }

    public getService<T>(name: string): T {
        const service = this.services.get(name);
        if (!service) {
            throw new Error(`Service ${name} not found or not initialized`);
        }
        return service as T;
    }

    public async dispose(): Promise<void> {
        // Cleanup services in reverse order of initialization
        const services = Array.from(this.services.entries()).reverse();
        
        for (const [name, service] of services) {
            try {
                if (service && typeof service.dispose === 'function') {
                    await service.dispose();
                }
            } catch (error) {
                console.error(`Error disposing ${name} service:`, error);
            }
        }

        this.services.clear();
        this.initializationStatus.clear();
        ServiceContainer.instance = null;
    }

    public static async reset(): Promise<void> {
        if (ServiceContainer.instance) {
            await ServiceContainer.instance.dispose();
        }
    }

    // Typed convenience methods
    public getDatasetService(): DatasetService {
        return this.getService<DatasetService>('dataset');
    }

    public getUIStateService(): UIStateService {
        return this.getService<UIStateService>('uiState');
    }

    public getWorkerPool(): WorkerPool | null {
        return this.getService<WorkerPool | null>('workerPool');
    }

    // Handle cleanup on page unload
    public static initializeCleanup(): void {
        if (typeof window !== 'undefined') {
            window.addEventListener('unload', () => {
                if (ServiceContainer.instance) {
                    void ServiceContainer.instance.dispose();
                }
            });
        }
    }
}