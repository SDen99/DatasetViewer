// workerPool.ts
import type { ProcessingResult } from './types';
import { getWorkerURL, validateWorkerURL } from './workerSetup';

interface WorkerTask {
    id: string;
    file: ArrayBuffer;
    fileName: string;
    resolve: (result: ProcessingResult) => void;
    reject: (error: Error) => void;
}

interface ManagedWorker {
    worker: Worker;
    busy: boolean;
    lastUsed: number;
    pyodideReady: boolean;
}

export class WorkerPool {
    private workers: ManagedWorker[] = [];
    private taskQueue: WorkerTask[] = [];
    private maxWorkers: number;
    private idleTimeout: number;
    private workerURL: string;

    constructor(
        maxWorkers = Math.max(1, navigator.hardwareConcurrency - 1),
        idleTimeout = 30000
    ) {
        this.maxWorkers = maxWorkers;
        this.idleTimeout = idleTimeout;
        // Get the appropriate worker URL for our environment
        this.workerURL = getWorkerURL('fileProcessor.worker.js');

        setInterval(() => this.cleanupIdleWorkers(), 10000);
    }

    private async createWorker(): Promise<ManagedWorker> {
        // Validate the worker URL before creating the worker
        const isValid = await validateWorkerURL(this.workerURL);
        if (!isValid) {
            throw new Error('Worker script is not accessible');
        }

        return new Promise((resolve, reject) => {
            try {
                // Create the worker with error handling
                const worker = new Worker(this.workerURL, {
                    type: 'module',
                    name: 'SAS-File-Processor'
                });

                const managedWorker: ManagedWorker = {
                    worker,
                    busy: false,
                    lastUsed: Date.now(),
                    pyodideReady: false
                };

                // Add error handling for worker creation
                worker.addEventListener('error', (error) => {
                    console.error('Worker error:', error);
                    this.handleWorkerError(error, managedWorker);
                });

                // Rest of your worker initialization code...
                // (Keep your existing initialization logic here)

            } catch (error) {
                console.error('Worker creation failed:', error);
                reject(error);
            }
        });
    }

    private async getAvailableWorker(): Promise<ManagedWorker> {
        // First, try to find an existing available worker
        let worker = this.workers.find(w => !w.busy && w.pyodideReady);

        if (!worker && this.workers.length < this.maxWorkers) {
            // Create a new worker if we haven't reached the limit
            try {
                worker = await this.createWorker();
                this.workers.push(worker);
            } catch (error) {
                console.error('Failed to create worker:', error);
                throw error;
            }
        }

        if (!worker) {
            // Wait for a worker to become available
            return new Promise((resolve) => {
                const checkInterval = setInterval(() => {
                    const availableWorker = this.workers.find(w => !w.busy && w.pyodideReady);
                    if (availableWorker) {
                        clearInterval(checkInterval);
                        resolve(availableWorker);
                    }
                }, 100);
            });
        }

        return worker;
    }

    private handleWorkerMessage(e: MessageEvent, managedWorker: ManagedWorker) {
        const task = this.taskQueue.find(t => t.id === e.data.taskId);
        if (!task) return;

        if (e.data.type === 'PROCESSING_COMPLETE') {
            task.resolve(e.data.result);
        } else if (e.data.type === 'PROCESSING_ERROR') {
            task.reject(new Error(e.data.error));
        }

        managedWorker.busy = false;
        managedWorker.lastUsed = Date.now();

        // Remove the completed task
        this.taskQueue = this.taskQueue.filter(t => t.id !== e.data.taskId);

        // Process next task if available
        this.processNextTask();
    }

    private handleWorkerError(e: ErrorEvent, managedWorker: ManagedWorker) {
        console.error('Worker error:', e);
        managedWorker.busy = false;
        // Don't process next task immediately after an error
        // Let the error propagate first
    }

    private async processNextTask() {
        if (this.taskQueue.length === 0) return;

        try {
            const worker = await this.getAvailableWorker();
            const task = this.taskQueue[0];

            worker.busy = true;
            worker.lastUsed = Date.now();

            worker.worker.postMessage({
                type: 'PROCESS_FILE',
                taskId: task.id,
                file: task.file,
                fileName: task.fileName
            });
        } catch (error) {
            console.error('Failed to process task:', error);
            // Handle task failure
            const task = this.taskQueue[0];
            task.reject(error);
            this.taskQueue.shift();
        }
    }

    private cleanupIdleWorkers() {
        const now = Date.now();
        this.workers = this.workers.filter(worker => {
            if (!worker.busy && (now - worker.lastUsed > this.idleTimeout)) {
                worker.worker.terminate();
                return false;
            }
            return true;
        });
    }

    public async processFile(file: ArrayBuffer, fileName: string): Promise<ProcessingResult> {
        return new Promise((resolve, reject) => {
            const task: WorkerTask = {
                id: `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                file,
                fileName,
                resolve,
                reject
            };

            this.taskQueue.push(task);
            this.processNextTask();
        });
    }

    public terminate() {
        this.workers.forEach(worker => {
            worker.worker.terminate();
        });
        this.workers = [];
        this.taskQueue = [];
    }
}