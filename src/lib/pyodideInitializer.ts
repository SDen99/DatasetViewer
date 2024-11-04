
// pyodideInitializer.ts
declare const loadPyodide: any;

export async function initializePyodide(): Promise<any> {
    if (typeof loadPyodide === 'undefined') {
        throw new Error('loadPyodide is not defined. Ensure Pyodide is correctly loaded.');
    }

    return loadPyodide({
        indexURL: 'https://cdn.jsdelivr.net/pyodide/v0.18.1/full/'
        // If using local files, use the following line instead
        // indexURL: '/pyodide-0.26.3/'
    });
}