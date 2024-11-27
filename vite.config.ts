import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

export default defineConfig({
	plugins: [sveltekit()],
	worker: {
		format: 'es',
		rollupOptions: {
			input: './src/workers/fileProcessor.worker.ts'
		}
	},
	esbuild: {
		target: 'esnext'
	},
	build: {
		rollupOptions: {
			input: {
				worker: './src/workers/fileProcessor.worker.ts'
			}
		}
	}
});