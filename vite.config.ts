import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

export default defineConfig({
	plugins: [sveltekit()],
	worker: {
		format: 'es', // Use ES modules format for workers
		plugins: [] // Any additional plugins needed for workers
	},
	build: {
		target: 'esnext', // Ensure we're targeting modern browsers
		rollupOptions: {
			output: {
				format: 'es' // Use ES modules format for output
			}
		}
	}
});
