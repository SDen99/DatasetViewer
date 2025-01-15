const PYODIDE_VERSION = 'v0.24.1';
const PYODIDE_BASE_URL = `https://cdn.jsdelivr.net/pyodide/${PYODIDE_VERSION}/full/`;

/** @type {any} */
let pyodide = null;

async function loadPyodideModule() {
	try {
		/* @vite-ignore */
		// @ts-ignore
		const pyodideModule = await import('https://cdn.jsdelivr.net/pyodide/v0.24.1/full/pyodide.mjs');
		return pyodideModule;
	} catch (error) {
		console.error('Failed to load Pyodide module:', error);
		throw error;
	}
}
async function initializePyodideInWorker() {
	try {
		const pyodideModule = await loadPyodideModule();

		pyodide = await pyodideModule.loadPyodide({
			indexURL: 'https://cdn.jsdelivr.net/pyodide/v0.24.1/full/',
			/** @param {string} msg */
			stderr: (msg) => console.error('Python Error:', msg)
		});

		await pyodide.loadPackage('pandas');

		self.postMessage({
			type: 'PYODIDE_READY',
			taskId: 'init'
		});
	} catch (error) {
		console.error('Pyodide initialization error:', error);
		self.postMessage({
			type: 'PYODIDE_ERROR',
			taskId: 'init',
			error: error instanceof Error ? error.message : String(error)
		});
	}
}

// Start initialization immediately
initializePyodideInWorker();

/** @param {ArrayBuffer} arrayBuffer */
async function processSasFile(arrayBuffer) {
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
self.onmessage = async (e) => {
	const { type, taskId, file, fileName } = e.data;

	if (type === 'PROCESS_FILE') {
		const startTime = performance.now();

		try {
			const result = await processSasFile(file);
			const processingTime = (performance.now() - startTime) / 1000;

			self.postMessage({
				type: 'PROCESSING_COMPLETE',
				taskId,
				result: {
					...result,
					processingTime
				}
			});
		} catch (error) {
			self.postMessage({
				type: 'PROCESSING_ERROR',
				taskId,
				error: error instanceof Error ? error.message : String(error),
				processingTime: (performance.now() - startTime) / 1000
			});
		}
	}
};
