<script lang="ts">
	import { formatStorageSize } from '$lib/utils/utilFunctions';
	import { Separator } from '$lib/components/core/separator';
	import { datasetStore } from '$lib/core/stores/datasetStore.svelte';

	$effect.root(() => {
		$effect(() => {
			console.log('Footer mounted', datasetStore);
		});
	});

	let stats = $derived(
		datasetStore.selectedDatasetId
			? datasetStore.datasets[datasetStore.selectedDatasetId].processingStats
			: null
	);
</script>

<footer
	class="relative border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60"
>
	{#if stats !== null}
		<div class="container flex h-8 items-center justify-between text-sm">
			<div class="flex items-center gap-4">
				{#if stats.uploadTime !== null}
					<div class="text-muted-foreground">
						Processing time: <span class="font-medium text-foreground">{stats.uploadTime}s</span>
					</div>
				{/if}
			</div>

			<div class="flex items-center gap-4">
				{#if stats.datasetSize !== null}
					<div class="text-muted-foreground">
						Size: <span class="font-medium text-foreground"
							>{formatStorageSize(stats.datasetSize)}</span
						>
					</div>
				{/if}
				{#if stats.numColumns !== null}
					<Separator orientation="vertical" class="h-4" />
					<div class="text-muted-foreground">
						Variables: <span class="font-medium text-foreground">{stats.numColumns}</span>
					</div>
				{/if}
				{#if stats.numRows !== null}
					<Separator orientation="vertical" class="h-4" />
					<div class="text-muted-foreground">
						Records: <span class="font-medium text-foreground">{stats.numRows}</span>
					</div>
				{/if}
			</div>
		</div>
	{/if}
</footer>
