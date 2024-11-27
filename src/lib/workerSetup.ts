// This helper function determines if we're in production
export function getWorkerURL(workerPath: string): string {
    if (import.meta.env.PROD) {
        // In production, we need to handle the path differently
        // Vercel serves static assets from /_app/
        return `/_app/immutable/workers/${workerPath}`;
    }
    // In development, we can use the standard URL pattern
    return new URL(workerPath, import.meta.url).href;
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