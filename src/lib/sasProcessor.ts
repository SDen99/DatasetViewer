export async function processSasFile(arrayBuffer: ArrayBuffer, pyodideReadyPromise: Promise<any>): Promise<any> {
    try {
        console.log('Waiting for Pyodide to be ready...');
        const pyodide = await pyodideReadyPromise;
        if (!pyodide) {
            throw new Error('Pyodide is not initialized');
        }
        await pyodide.loadPackage('pandas');
        const uint8Array = new Uint8Array(arrayBuffer);
        pyodide.FS.writeFile('/tmpfile.sas7bdat', uint8Array);
        const code = `
import pandas as pd
import warnings
import json
import numpy as np

# Check if lzma is available
try:
    import lzma
    lzma_available = True
except ImportError:
    lzma_available = False
    warnings.warn("lzma module is not available")

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
    # Read the SAS file using pandas
    df = pd.read_sas('/tmpfile.sas7bdat', format='sas7bdat')

    # Replace NaN values with None
    df = df.where(pd.notnull(df), None)

    # Convert int32 columns to int
    for col in df.select_dtypes(include=['int32']).columns:
        df[col] = df[col].astype(int)

    # Get dataset details
    details = {
        'num_rows': df.shape[0],
        'num_columns': df.shape[1],
        'columns': df.columns.tolist(),
        'dtypes': df.dtypes.astype(str).to_dict(),
        'summary': df.describe().replace({np.nan: None}).to_dict(),
        'unique_values': {col: df[col].unique().tolist() for col in df.select_dtypes(include=['object']).columns}
    }

    # Convert the DataFrame to JSON
    json_data = df.to_json(orient='records', date_format='iso', default_handler=convert_bytes)
    result = json.dumps({'details': details, 'data': json_data}, default=convert_bytes)
except Exception as e:
    result = json.dumps({'error': str(e)})

result
`;
        console.log('Running Python code...');
        const result = await pyodide.runPythonAsync(code);
        console.log('Python result:', result);
        const parsedResult = JSON.parse(result);
        if (parsedResult.error) {
            throw new Error(parsedResult.error);
        }
        return { details: parsedResult.details, data: JSON.parse(parsedResult.data) };
    } catch (error) {
        console.error('Error processing SAS file:', error);
        throw error;
    }
}