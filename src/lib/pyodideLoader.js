// pyodideLoader.js
self.loadPyodide = await import("https://cdn.jsdelivr.net/pyodide/v0.24.1/full/pyodide.mjs");

let pyodide = null;

async function initializePyodide() {
    try {
        pyodide = await self.loadPyodide.loadPyodide({
            indexURL: 'https://cdn.jsdelivr.net/pyodide/v0.24.1/full/'
        });

        // Initialize required Python packages
        await pyodide.loadPackage(['numpy', 'pandas']);

        self.postMessage({
            type: 'PYODIDE_READY',
            taskId: 'init'
        });
    } catch (error) {
        self.postMessage({
            type: 'PYODIDE_ERROR',
            taskId: 'init',
            error: error.message
        });
    }
}

initializePyodide();

export { pyodide };