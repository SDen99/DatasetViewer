self.loadPyodide = await import("https://cdn.jsdelivr.net/pyodide/v0.24.1/full/pyodide.mjs");

let pyodide = null;

// Create an initialization function that wraps everything in an async function
function initialize() {
    async function initializePyodideInWorker() {
        try {
            const pyodideModule = await import('https://cdn.jsdelivr.net/pyodide/v0.24.1/full/pyodide.mjs');

            pyodide = await pyodideModule.loadPyodide({
                indexURL: 'https://cdn.jsdelivr.net/pyodide/v0.24.1/full/',
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
                error: error.message
            });
        }
    }

    // Start initialization
    initializePyodideInWorker();
}

// Call initialize function instead of having top-level await
initialize();

export { pyodide };