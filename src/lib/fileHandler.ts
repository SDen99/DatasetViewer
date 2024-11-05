// fileHandler.ts
export async function handleFileChange(
    event: Event,
    processSasFile: (arrayBuffer: ArrayBuffer, pyodideReadyPromise: Promise<any>) => Promise<any>,
    setLoadingState: (state: boolean) => void,
    setFileName: (name: string) => void,
    setFileContent: (content: string) => void,
    setUploadTime: (time: string) => void,
    setNumVariables: (num: number) => void,
    setVariables: (variables: Array<string>) => void,
    setNumRecords: (num: number) => void,
    setUniqueValues: (uniqueValues: { [key: string]: string[] }) => void,
    pyodideReadyPromise: Promise<any>
) {
    console.log('handleFileChange called');
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    console.log('Selected file:', file);
    if (file && file.name.endsWith('.sas7bdat')) {
        setFileName(file.name);
        const reader = new FileReader();
        const startTime = new Date(); // Start the timer
        setLoadingState(true); // Set loading state to true
        reader.onload = async () => {
            try {
                const arrayBuffer = reader.result as ArrayBuffer;
                console.log('Processing SAS file...');
                const { details, data } = await processSasFile(arrayBuffer, pyodideReadyPromise);
                console.log('details:', details);
                console.log('data:', data);
                setVariables(details.columns);
                setFileContent(JSON.stringify(data, null, 2));
                setNumVariables(details.num_columns);
                setNumRecords(details.num_rows);
                setUniqueValues(details.unique_values);
                const endTime = new Date(); // End the timer
                const timeDiff = endTime.getTime() - startTime.getTime(); // Time difference in milliseconds
                setUploadTime(`Upload and processing time: ${(timeDiff / 1000).toFixed(2)} seconds`);
            } catch (error) {
                console.error('Error processing SAS file:', error);
                setFileContent('Error processing SAS file.');
            } finally {
                setLoadingState(false); // Set loading state to false
            }
        };
        reader.readAsArrayBuffer(file);
    } else {
        setFileName('Invalid file type. Please select a .sas7bdat file.');
    }
}