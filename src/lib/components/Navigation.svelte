<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { formatStorageSize } from '$lib/utils';

	export let handleFileChangeEvent: (event: Event) => void;
	export let isLoading: boolean;

	let storageUsage = '';
	let storageUpdateInterval: number;

	async function updateStorageUsage() {
		try {
			const estimate = await navigator.storage.estimate();
			if (estimate.usage) {
				storageUsage = formatStorageSize(estimate.usage);
			}
		} catch (error) {
			console.warn('Storage estimation not available:', error);
			storageUsage = 'N/A';
		}
	}

	onMount(() => {
		// Initial update
		updateStorageUsage();

		// Update every 5 seconds
		storageUpdateInterval = setInterval(updateStorageUsage, 5000);
	});

	onDestroy(() => {
		if (storageUpdateInterval) {
			clearInterval(storageUpdateInterval);
		}
	});
</script>

<nav class="relative w-full bg-blue-500 p-4 text-white">
	<div class="flex items-center justify-between">
		<div class="flex-1">
			<h1 class="text-2xl font-bold">Upload .sas7bdat Files</h1>
			<input
				type="file"
				accept=".sas7bdat"
				on:change={handleFileChangeEvent}
				multiple
				class="mb-4 rounded border border-gray-300 p-2"
			/>
		</div>

		<div class="absolute right-4 top-4 rounded-lg bg-blue-600 px-3 py-1 text-sm">
			DB Size: {storageUsage || 'N/A'}
		</div>
	</div>

	{#if isLoading}
		<div class="flex items-center justify-center space-x-2">
			<div class="h-8 w-8 animate-spin rounded-full border-4 border-dashed border-white"></div>
			<div>Loading...</div>
		</div>
	{/if}
</nav>
