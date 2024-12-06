<script lang="ts">
	import { formatStorageSize } from '$lib/utils';
	import { Separator } from '$lib/components/ui/separator';

	export let uploadTime: number | null;
	export let numColumns: number | null;
	export let numRows: number | null;
	export let datasetSize: number | null;
</script>

<footer
	class="relative border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60"
>
	<div class="container flex h-14 items-center justify-between text-sm">
		<div class="flex items-center gap-4">
			{#if uploadTime !== null}
				<div class="text-muted-foreground">
					Processing time: <span class="font-medium text-foreground">{uploadTime}s</span>
				</div>
			{/if}
		</div>

		<div class="flex items-center gap-4">
			{#if datasetSize !== null}
				<div class="text-muted-foreground">
					Size: <span class="font-medium text-foreground">{formatStorageSize(datasetSize)}</span>
				</div>
			{/if}
			{#if numColumns !== null}
				<Separator orientation="vertical" class="h-4" />
				<div class="text-muted-foreground">
					Variables: <span class="font-medium text-foreground">{numColumns}</span>
				</div>
			{/if}
			{#if numRows !== null}
				<Separator orientation="vertical" class="h-4" />
				<div class="text-muted-foreground">
					Records: <span class="font-medium text-foreground">{numRows}</span>
				</div>
			{/if}
		</div>
	</div>
</footer>
