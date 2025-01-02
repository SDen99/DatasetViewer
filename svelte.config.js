import adapter from '@sveltejs/adapter-static';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

/** @type {import('@sveltejs/kit').Config} */
const config = {
	preprocess: vitePreprocess(),
	kit: {
		adapter: adapter({
			fallback: 'index.html', // SPA mode
			strict: false
		}),
		alias: {
			$workers: 'src/lib/workers',
			$config: 'src/config.js'
		}
	}
};

export default config;
