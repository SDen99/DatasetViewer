import type { PyodideInterface, ProcessingResult } from './types';
import type { Writable } from 'svelte/store';

export async function handleFileChange(
    file: File,
    processSasFile: (arrayBuffer: ArrayBuffer, pyodideReadyPromise: Promise<PyodideInterface>) => Promise<ProcessingResult>,
    setLoadingState: (state: boolean) => void,
    setUploadTime: (time: string) => void,
    datasetsStore: Writable<Map<string, ProcessingResult>>,
    pyodideReadyPromise: Promise<PyodideInterface>
): Promise<void> {
    if (!file) {
        console.error('No file selected');
        return;
    }

    if (!file.name.endsWith('.sas7bdat')) {
        console.error('Invalid file type. Please select a .sas7bdat file.');
        return;
    }

    const startTime = performance.now();
    setLoadingState(true);

    try {
        const arrayBuffer = await file.arrayBuffer();
        console.log('Processing SAS file...');
        const result = await processSasFile(arrayBuffer, pyodideReadyPromise);

        const processingTime = (performance.now() - startTime) / 1000;
        result.processingTime = processingTime; // Add processing time to the result
        console.log(result);

        datasetsStore.update(datasets => {
            datasets.set(file.name, result);
            return datasets;
        });

        setUploadTime(`Upload and processing time: ${processingTime.toFixed(2)} seconds`);
    } catch (error) {
        console.error('Error processing SAS file:', error);
        // Consider adding error handling UI feedback here
    } finally {
        setLoadingState(false);
    }
}
