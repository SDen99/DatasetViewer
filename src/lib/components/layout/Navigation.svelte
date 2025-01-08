<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { formatStorageSize } from '$lib/utils/utilFunctions';
	import { Badge } from '$lib/components/core/badge';
	import FileUpload from '$lib/components/FileUpload.svelte';

	interface Props {
		handleFileChangeEvent: (event: Event) => void;
		isLoading: boolean;
	}

	let { handleFileChangeEvent, isLoading }: Props = $props();

	$effect(() => {
		$inspect('Navigation props:', { handleFileChangeEvent, isLoading });
	});

	let storageUsage = $state('');
	let storageUpdateInterval: any;

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
</script>

<header
	class="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60"
>
	<div class="container flex h-14 max-w-none px-6">
		<div class="flex w-full items-center justify-between">
			<div class="flex items-center gap-4">
				<FileUpload {handleFileChangeEvent} />
				{#if isLoading}
					<div class="flex items-center gap-2 text-sm text-muted-foreground">
						<div
							class="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent"
						></div>
						<span>Processing files...</span>
					</div>
				{/if}
			</div>

			<!-- Left side with fixed positioning -->
			<div class="absolute left-1/2 flex -translate-x-1/2 transform items-center gap-2">
				<h1 class="text-xl font-semibold">Data Viewer</h1>
				<Badge variant="outline" class="font-mono">v0.1</Badge>
			</div>

			<!-- Right side content -->
			<div class="flex items-center gap-6">
				<Badge variant="secondary" class="ml-auto">
					DB Size: {storageUsage}
				</Badge>
			</div>
		</div>
	</div>
</header>
