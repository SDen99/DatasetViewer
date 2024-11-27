import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

export default defineConfig({
	plugins: [sveltekit()],
	build: {
		target: 'esnext',
		rollupOptions: {
			input: {
				main: 'src/app.html',
				worker: 'src/workers/fileProcessor.worker.ts'
			},
			output: {
				entryFileNames: (chunkInfo) => {
					return chunkInfo.name === 'worker'
						? '_app/immutable/workers/[name].js'
						: '_app/immutable/chunks/[name].[hash].js';
				}
			}
		}
	}
});