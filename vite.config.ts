import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

export default defineConfig({
	plugins: [sveltekit()],
	worker: {
		format: 'es'
	},
	build: {
		rollupOptions: {
			output: {
				assetFileNames: (chunkInfo: { type: string; name?: string }) => {
					return chunkInfo.name?.includes('fileProcessor.worker')
						? 'worker.js'
						: 'assets/[name]-[hash][extname]';
				}
			}
		}
	}
});