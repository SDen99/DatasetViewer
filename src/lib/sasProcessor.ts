interface ProcessingResult {
    details: {
        num_rows: number;
        num_columns: number;
        columns: string[];
        dtypes: Record<string, string>;
        summary: Record<string, any>;
        unique_values: Record<string, any[]>;
    };
    data: any[];
}

interface PyodideInterface {
    loadPackage: (name: string) => Promise<void>;
    runPythonAsync: (code: string) => Promise<string>;
    FS: {
        writeFile: (path: string, data: Uint8Array) => void;
    };
}

export async function processSasFile(
    arrayBuffer: ArrayBuffer,
    pyodideReadyPromise: Promise<PyodideInterface>
): Promise<ProcessingResult> {
    const pyodide = await pyodideReadyPromise;
    if (!pyodide) {
        throw new Error('Pyodide is not initialized');
    }

    try {
        await pyodide.loadPackage('pandas');
        const uint8Array = new Uint8Array(arrayBuffer);
        pyodide.FS.writeFile('/tmpfile.sas7bdat', uint8Array);

        const pythonCode = getPythonCode();
        const result = await pyodide.runPythonAsync(pythonCode);
        const parsedResult = JSON.parse(result);

        if (parsedResult.error) {
            throw new Error(parsedResult.error);
        }

        return {
            details: parsedResult.details,
            data: JSON.parse(parsedResult.data)
        };
    } catch (error) {
        console.error('Error in processSasFile:', error);
        throw new Error(`Failed to process SAS file: ${error.message}`);
    }
}

// 4. Separated Python code into its own function
function getPythonCode(): string {
    return `
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
        return obj.tolist()
    if isinstance(obj, pd.Timestamp):
        return obj.isoformat()
    if pd.isna(obj):
        return None
    raise TypeError(f"Object of type {type(obj).__name__} is not JSON serializable")

try:
    df = pd.read_sas('/tmpfile.sas7bdat', format='sas7bdat')
    df = df.where(pd.notnull(df), None)
    
    for col in df.select_dtypes(include=['int32']).columns:
        df[col] = df[col].astype(int)

    details = {
        'num_rows': df.shape[0],
        'num_columns': df.shape[1],
        'columns': df.columns.tolist(),
        'dtypes': df.dtypes.astype(str).to_dict(),
        'summary': df.describe().replace({np.nan: None}).to_dict(),
        'unique_values': {col: df[col].unique().tolist() 
                         for col in df.select_dtypes(include=['object']).columns}
    }

    json_data = df.to_json(orient='records', date_format='iso', 
                          default_handler=convert_bytes)
    result = json.dumps({'details': details, 'data': json_data}, 
                       default=convert_bytes)
except Exception as e:
    result = json.dumps({'error': str(e)})

result
`;
}