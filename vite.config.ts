import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

export default defineConfig({
	plugins: [sveltekit()],
	worker: {
		format: 'es'
	},
	// Direct the worker file to public directory
	build: {
		rollupOptions: {
			output: {
				assetFileNames: (assetInfo) => {
					if (assetInfo.name === 'fileProcessor.worker.ts') {
						return 'worker.js';
					}
					return 'assets/[name]-[hash][extname]';
				}
			}
		}
	}
});