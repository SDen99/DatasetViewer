import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

export default defineConfig({
	plugins: [sveltekit()],
	worker: {
		format: 'es'
	},
	define: {
		'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV)
	},
	server: {
		fs: {
			allow: ['static'] // Add static to allowed directories
		}
	},
	build: {
		rollupOptions: {
			output: {
				manualChunks(id) {
					if (id.includes('node_modules')) {
						return 'vendor';
					}
				}
			}
		},

		sourcemap: 'hidden',
		minify: 'terser',
		terserOptions: {
			compress: {
				drop_console: true, // removes all console.* calls
				// or if you want to keep some:
				pure_funcs: ['console.log', 'console.debug'] // only removes specific console methods
			}
		}
	}
});
