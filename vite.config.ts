import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';
import { fileURLToPath } from 'url';
import path from 'path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
	plugins: [sveltekit()],
	build: {
		target: 'esnext',
		rollupOptions: {
			input: {
				worker: path.resolve(__dirname, 'src/workers/fileProcessor.worker.ts')
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