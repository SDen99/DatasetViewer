// This helper function determines if we're in production
export function getWorkerURL(workerPath: string): string {
    return import.meta.env.PROD ?
        `/_app/immutable/workers/worker.js` :
        `/src/workers/${workerPath}`;
}

// This function validates that our worker is available
export async function validateWorkerURL(url: string): Promise<boolean> {
    try {
        const response = await fetch(url, { method: 'HEAD' });
        return response.ok;
    } catch (error) {
        console.error('Worker validation failed:', error);
        return false;
    }
}