<script lang="ts">
	import { formatStorageSize } from '$lib/utils';
	import { Separator } from '$lib/components/ui/separator';
	import { selectedDataset, processingStats } from '$lib/stores';

	$: stats = $selectedDataset
		? $selectedDataset.processingStats // Use dataset's stored stats if a dataset is selected
		: $processingStats;
</script>

<footer
	class="relative border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60"
>
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
</footer>
