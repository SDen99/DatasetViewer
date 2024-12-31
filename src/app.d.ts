// See https://svelte.dev/docs/kit/types#app.d.ts
// for information about these interfaces
declare global {
	namespace App {
		interface HTMLAttributes<T> {
			// For snippets
			'onrender:': (e: CustomEvent) => void;
		}
	}
}

export {};
