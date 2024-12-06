<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { formatStorageSize } from '$lib/utils';
	import { Badge } from '$lib/components/ui/badge';
	import { Button } from '$lib/components/ui/button';
	import { Upload } from 'lucide-svelte'; // Removed Input import since we don't need it

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
		updateStorageUsage();
		storageUpdateInterval = setInterval(updateStorageUsage, 5000);
	});

	onDestroy(() => {
		if (storageUpdateInterval) {
			clearInterval(storageUpdateInterval);
		}
	});

	function triggerFileInput() {
		const input = document.createElement('input');
		input.type = 'file';
		input.accept = '.sas7bdat';
		input.multiple = true;
		input.onchange = handleFileChangeEvent;
		input.click();
	}
</script>

<header
	class="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60"
>
	<div class="container flex h-14 items-center">
		<div class="flex flex-1 items-center justify-between">
			<div class="flex items-center gap-2">
				<h1 class="text-xl font-semibold">SAS Data Viewer</h1>
				<Badge variant="outline" class="font-mono">v1.0</Badge>
			</div>

			<div class="flex items-center gap-4">
				<Button on:click={triggerFileInput} variant="outline" class="gap-2">
					<Upload class="h-4 w-4" />
					Upload Files
				</Button>

				<Badge variant="secondary">
					DB Size: {storageUsage}
				</Badge>
			</div>
		</div>
	</div>

	{#if isLoading}
		<div class="container py-2">
			<div class="flex items-center gap-2 text-sm text-muted-foreground">
				<div
					class="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent"
				></div>
				<span>Processing files...</span>
			</div>
		</div>
	{/if}
</header>
