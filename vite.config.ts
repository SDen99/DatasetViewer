import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

export default defineConfig({
	plugins: [sveltekit()],
	worker: {
		format: 'es'
	},
	define: {
		'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV)
	}
});
