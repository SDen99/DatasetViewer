<script lang="ts">
	export let uploadTime: number | null;
	export let numColumns: number | null;
	export let numRows: number | null;
	console.log(uploadTime, numColumns, numRows);
</script>

<footer class="flex w-full items-center justify-between bg-gray-800 p-4 text-white">
	<div>
		{#if uploadTime !== null}
			<p class="text-sm">
				Upload and processing time: {uploadTime} seconds
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
