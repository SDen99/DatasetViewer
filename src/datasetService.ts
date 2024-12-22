export class DatasetService {
    public static async create(): Promise<DatasetService> {
        const service = new DatasetService();
        await service.initialize();
        return service;
    }
    private static instance: DatasetService;
    private readonly dbName = 'SasDataViewer';
    private readonly version = 1;
    private db: IDBDatabase | null = null;

    private constructor() { }

    public static getInstance(): DatasetService {
        if (!DatasetService.instance) {
            DatasetService.instance = new DatasetService();
        }
        return DatasetService.instance;
    }

    public async initialize(): Promise<void> {
        if (this.db) return;

        return new Promise((resolve, reject) => {
            const request = indexedDB.open(this.dbName, this.version);

            request.onerror = () => reject(new Error('Failed to open database'));

            request.onsuccess = (event) => {
                this.db = (event.target as IDBOpenDBRequest).result;
                resolve();
            };

            request.onupgradeneeded = (event) => {
                const db = (event.target as IDBOpenDBRequest).result;

                // Create the datasets store if it doesn't exist
                if (!db.objectStoreNames.contains('datasets')) {
                    db.createObjectStore('datasets', { keyPath: 'fileName' });
                }
            };
        });
    }

    private async transaction<T>(
        mode: IDBTransactionMode,
        callback: (store: IDBObjectStore) => IDBRequest<T>
    ): Promise<T> {
        if (!this.db) throw new Error('Database not initialized');

        return new Promise((resolve, reject) => {
            const transaction = this.db!.transaction('datasets', mode);
            const store = transaction.objectStore('datasets');
            const request = callback(store);

            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    public async addDataset(dataset: {
        fileName: string;
        data: any[];
        details: {
            num_rows: number;
            num_columns: number;
            columns: string[];
            dtypes: Record<string, string>;
            summary: Record<string, any>;
        };
        processingTime: number;
    }): Promise<void> {
        if (!this.db) throw new Error('Database not initialized');

        return new Promise((resolve, reject) => {
            const transaction = this.db!.transaction('datasets', 'readwrite');
            const store = transaction.objectStore('datasets');
            const request = store.put(dataset);

            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    }

    public async getDataset(fileName: string): Promise<any> {
        return this.transaction<any>(
            'readonly',
            (store) => store.get(fileName)
        );
    }

    public async getAllDatasets(): Promise<Record<string, any>> {
        if (!this.db) throw new Error('Database not initialized');

        return new Promise((resolve, reject) => {
            const transaction = this.db!.transaction('datasets', 'readonly');
            const store = transaction.objectStore('datasets');
            const request = store.getAll();

            request.onsuccess = () => {
                // Convert the array of datasets to a Record object
                const datasets: Record<string, any> = {};
                request.result.forEach(dataset => {
                    datasets[dataset.fileName] = dataset;
                });
                resolve(datasets);
            };

            request.onerror = () => reject(request.error);
        });
    }


    public async removeDataset(fileName: string): Promise<void> {
        if (!this.db) {
            console.error('🔴 DatasetService: Database not initialized for deletion');
            throw new Error('Database not initialized');
        }

        //console.log('🟡 DatasetService: Starting removal of dataset:', fileName);

        return new Promise((resolve, reject) => {
            const transaction = this.db!.transaction('datasets', 'readwrite');
            const store = transaction.objectStore('datasets');

            //console.log('🟡 DatasetService: Created transaction for deletion');

            transaction.oncomplete = () => {
                //console.log('🟢 DatasetService: Transaction completed successfully');
                resolve();
            };

            transaction.onerror = (event) => {
                //console.error('🔴 DatasetService: Transaction error:', event);
                reject(transaction.error);
            };

            transaction.onabort = () => {
                //console.error('🔴 DatasetService: Transaction aborted');
                reject(new Error('Transaction aborted'));
            };

            const request = store.delete(fileName);

            request.onsuccess = () => {
                //console.log('🟢 DatasetService: Delete request successful for:', fileName);
            };

            request.onerror = () => {
                //console.error('🔴 DatasetService: Delete request failed for:', fileName);
                reject(request.error);
            };
        });
    }

    public async getDatabaseSize(): Promise<number> {
        if (!this.db) throw new Error('Database not initialized');

        return new Promise((resolve, reject) => {
            const transaction = this.db!.transaction('datasets', 'readonly');
            const store = transaction.objectStore('datasets');
            const request = store.getAll();

            request.onsuccess = () => {
                const size = new Blob([JSON.stringify(request.result)]).size;
                resolve(size);
            };

            request.onerror = () => reject(request.error);
        });
    }
}