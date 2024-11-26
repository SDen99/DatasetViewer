// fileHandler.ts
import type { ProcessingResult } from './types';
import type { Writable } from 'svelte/store';
import { WorkerPool } from './workerPool';

// Create a single worker pool instance
const workerPool = new WorkerPool();

export async function handleFileChange(
    file: File,
    setLoadingState: (state: boolean) => void,
    setUploadTime: (time: string) => void,
    datasetsStore: Writable<Map<string, ProcessingResult>>
): Promise<void> {
    if (!file) {
        console.error('No file selected');
        return;
    }

    if (!file.name.endsWith('.sas7bdat')) {
        console.error('Invalid file type. Please select a .sas7bdat file.');
        return;
    }

    setLoadingState(true);
    const startTime = performance.now();

    try {
        // Convert file to ArrayBuffer
        const arrayBuffer = await file.arrayBuffer();

        // Process the file using our worker pool
        const result = await workerPool.processFile(arrayBuffer, file.name);

        // Update the store with the result
        datasetsStore.update(datasets => {
            datasets.set(file.name, {
                ...result,
                processingTime: (performance.now() - startTime) / 1000
            });
            return datasets;
        });

        setUploadTime(`Upload and processing time: ${((performance.now() - startTime) / 1000).toFixed(2)} seconds`);
    } catch (error) {
        console.error('Error processing SAS file:', error);
        // You might want to show this error to the user in your UI
    } finally {
        setLoadingState(false);
    }
}

export async function handleFileChangeEvent(event: Event) {
    const input = event.target as HTMLInputElement;
    const files = input.files;

    if (files) {
        const startTime = performance.now();
        setLoadingState(true);

        try {
            // Process all files in parallel through the worker pool
            await Promise.all(Array.from(files).map(file =>
                handleFileChange(
                    file,
                    setLoadingState,
                    setUploadTime,
                    datasetsStore
                )
            ));

            setUploadTime(`Total processing time: ${((performance.now() - startTime) / 1000).toFixed(2)} seconds`);
        } finally {
            setLoadingState(false);
        }
    }
}

// Make sure to call this when your application shuts down
export function cleanup() {
    workerPool.terminate();
}