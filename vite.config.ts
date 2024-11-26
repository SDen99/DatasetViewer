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
		rollupOptions: {
			output: {
				format: 'es',
				inlineDynamicImports: true
			}
		}
	}
});