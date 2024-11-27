// fileProcessor.worker.ts
import { pyodide } from './pyodideLoader.js';

interface WorkerInMessage {
    type: 'PROCESS_FILE';
    taskId: string;
    file: ArrayBuffer;
    fileName: string;
}

interface WorkerOutMessage {
    taskId: string;
    type: 'PROCESSING_COMPLETE' | 'PROCESSING_ERROR' | 'PYODIDE_READY' | 'PYODIDE_ERROR';
    result?: any;
    error?: string;
    processingTime?: number;
}

async function processSasFile(arrayBuffer: ArrayBuffer): Promise<any> {
    if (!pyodide) {
        throw new Error('Pyodide not initialized');
    }

    try {
        // Write the input file to Pyodide's virtual filesystem
        const uint8Array = new Uint8Array(arrayBuffer);
        pyodide.FS.writeFile('/tmpfile.sas7bdat', uint8Array);

        // Now we'll run your Python code, with a few adjustments to work in Pyodide
        const result = await pyodide.runPythonAsync(`
            import pandas as pd
            import warnings
            import json
            import numpy as np

            def convert_bytes(obj):
                if isinstance(obj, bytes):
                    return obj.decode('utf-8', errors='ignore')
                if isinstance(obj, (np.integer, int)):
                    return int(obj)
                if isinstance(obj, (np.floating, float)):
                    return float(obj)
                if isinstance(obj, (np.ndarray, list)):
                    return [x for x in obj] if hasattr(obj, 'tolist') else obj
                if isinstance(obj, pd.Timestamp):
                    return obj.isoformat()
                if pd.isna(obj):
                    return None
                raise TypeError(f"Object of type {type(obj).__name__} is not JSON serializable")

            try:
                # Read the SAS file using pandas
                df = pd.read_sas('/tmpfile.sas7bdat', format='sas7bdat')
                df = df.where(pd.notnull(df), None)
                
                # Convert int32 columns to regular integers
                for col in df.select_dtypes(include=['int32']).columns:
                    df[col] = df[col].astype(int)

                # Create the details dictionary with dataset information
                details = {
                    'num_rows': int(df.shape[0]),  # Convert numpy.int64 to regular int
                    'num_columns': int(df.shape[1]),
                    'columns': df.columns.tolist(),
                    'dtypes': df.dtypes.astype(str).to_dict(),
                    'summary': df.describe().replace({np.nan: None}).to_dict(),
                    'unique_values': {col: df[col].unique().tolist() 
                                    for col in df.select_dtypes(include=['object']).columns}
                }

                # Convert the data to JSON format
                json_data = df.to_json(orient='records', date_format='iso', 
                                     default_handler=convert_bytes)
                                     
                # Combine details and data into final result
                result = json.dumps({'details': details, 'data': json_data}, 
                                  default=convert_bytes)
            except Exception as e:
                result = json.dumps({'error': str(e)})

            result  # Return the JSON string
        `);

        // Parse the JSON string we got from Python
        const parsedResult = JSON.parse(result);

        // If there was an error in Python, throw it
        if (parsedResult.error) {
            throw new Error(parsedResult.error);
        }

        // Parse the nested data JSON string
        parsedResult.data = JSON.parse(parsedResult.data);

        return parsedResult;
    } catch (error) {
        console.error('Processing error:', error);
        throw error;
    } finally {
        // Clean up the temporary file
        try {
            pyodide.FS.unlink('/tmpfile.sas7bdat');
        } catch (cleanupError) {
            console.warn('Cleanup error:', cleanupError);
        }
    }
}

// Handle messages from the main thread
self.onmessage = async (e: MessageEvent<WorkerInMessage>) => {
    const { type, taskId, file, fileName } = e.data;

    if (type === 'PROCESS_FILE') {
        const startTime = performance.now();

        try {
            const result = await processSasFile(file);

            self.postMessage({
                type: 'PROCESSING_COMPLETE',
                taskId,
                result,
                processingTime: (performance.now() - startTime) / 1000
            } as WorkerOutMessage);
        } catch (error) {
            self.postMessage({
                type: 'PROCESSING_ERROR',
                taskId,
                error: error.message,
                processingTime: (performance.now() - startTime) / 1000
            } as WorkerOutMessage);
        }
    }
};