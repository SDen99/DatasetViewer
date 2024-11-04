export async function processSasFile(arrayBuffer: ArrayBuffer, pyodideReadyPromise: Promise<any>): Promise<any> {
    try {
        const pyodide = await pyodideReadyPromise;
        await pyodide.loadPackage('pandas');
        const uint8Array = new Uint8Array(arrayBuffer);
        pyodide.FS.writeFile('/tmpfile.sas7bdat', uint8Array);
        const code = `
import pandas as pd
import warnings

# Check if lzma is available
#try:
#    import lzma
#except ImportError:
#    warnings.warn("lzma module is not available. Attempting to read the file without lzma support.")

df = pd.read_sas('/tmpfile.sas7bdat', format='sas7bdat')
df.to_json(orient='records')

# Convert the DataFrame to JSON
json_data = df.to_json(orient='records')
json_data
`;
        const jsonData = await pyodide.runPythonAsync(code);
        //  console.log('jsonData:', jsonData);
        return JSON.parse(jsonData);

    } catch (error) {
        console.error('Error in processSasFile:', error);
        throw error;
    }
}