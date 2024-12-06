<script lang="ts">
	import { formatStorageSize } from '$lib/utils';
	export let uploadTime: number | null;
	export let numColumns: number | null;
	export let numRows: number | null;
	export let datasetSize: number | null;
</script>

<footer class="flex w-full items-center justify-between bg-gray-800 p-4 text-white">
	<div>
		{#if uploadTime !== null}
			<p class="text-sm">
				Upload and processing time: {uploadTime} seconds
			</p>
		{/if}
	</div>
	<div class="text-center">
		{#if datasetSize !== null}
			<p class="text-sm">
				Dataset size: {formatStorageSize(datasetSize)}
			</p>
		{/if}
	</div>
	<div>
		{#if numColumns !== null && numRows !== null}
			<p class="text-sm">
				Variables: {numColumns}
				Records: {numRows}
			</p>
		{/if}
	</div>
</footer>
