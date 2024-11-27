import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

export default defineConfig({
	plugins: [sveltekit()],
	worker: {
		format: 'es',
		plugins: [sveltekit()],
		target: 'esnext'
	},
	build: {
		target: 'esnext',
		modulePreload: {
			polyfill: true
		}
	}
});