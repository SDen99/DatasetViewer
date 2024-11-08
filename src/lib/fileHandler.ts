import type { Writable } from "svelte/store";

// fileHandler.ts
export async function handleFileChange(
    file: File,
    processSasFile: (arrayBuffer: ArrayBuffer, pyodideReadyPromise: Promise<any>) => Promise<any>,
    setLoadingState: (state: boolean) => void,
    setUploadTime: (time: string) => void,
    datasetsStore: Writable<Map<string, any>>,
    pyodideReadyPromise: Promise<any>
) {
    console.log('handleFileChange called');
    console.log('Selected file:', file);
    if (file && file.name.endsWith('.sas7bdat')) {
        const reader = new FileReader();
        const startTime = new Date(); // Start the timer
        setLoadingState(true); // Set loading state to true
        reader.onload = async () => {
            try {
                const arrayBuffer = reader.result as ArrayBuffer;
                console.log('Processing SAS file...');
                const result = await processSasFile(arrayBuffer, pyodideReadyPromise);
                console.log('result:', result);
                datasetsStore.update(datasets => {
                    datasets.set(file.name, result);
                    return datasets;
                });
                const endTime = new Date(); // End the timer
                const timeDiff = endTime.getTime() - startTime.getTime(); // Time difference in milliseconds
                setUploadTime(`Upload and processing time: ${(timeDiff / 1000).toFixed(2)} seconds`);
            } catch (error) {
                console.error('Error processing SAS file:', error);
            } finally {
                setLoadingState(false); // Set loading state to false
            }
        };
        reader.readAsArrayBuffer(file);
    } else {
        console.error('Invalid file type. Please select a .sas7bdat file.');
    }
}