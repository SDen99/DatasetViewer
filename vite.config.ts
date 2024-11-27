import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

export default defineConfig({
	plugins: [sveltekit()],
	worker: {
		format: 'es',
		plugins: () => []
	},
	build: {
		target: 'esnext',
	},
	optimizeDeps: {
		exclude: ['pyodide']  // Add this
	},
	server: {
		fs: {
			allow: ['./node_modules/pyodide']  // Add this
		}
	}
});