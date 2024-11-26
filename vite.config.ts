import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

export default defineConfig({
	plugins: [sveltekit()],
	worker: {
		format: 'es',
		plugins: () => []
	},
	build: {
		rollupOptions: {
			input: {
				main: 'app.html',
				worker: 'src/fileProcessor.worker.ts'
			}
		}
	}
});