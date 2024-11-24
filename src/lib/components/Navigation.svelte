<script lang="ts">
	export let handleFileChangeEvent: (event: Event) => void;
	export let isLoading: boolean;
</script>

<nav class="w-full bg-blue-500 p-4 text-white">
	<h1 class="text-2xl font-bold">Upload .sas7bdat Files</h1>
	<input
		type="file"
		accept=".sas7bdat"
		on:change={handleFileChangeEvent}
		multiple
		class="mb-4 rounded border border-gray-300 p-2"
	/>
	{#if isLoading}
		<div class="flex items-center justify-center space-x-2">
			<div class="h-8 w-8 animate-spin rounded-full border-4 border-dashed border-white"></div>
			<div>Loading...</div>
		</div>
	{/if}
</nav>
