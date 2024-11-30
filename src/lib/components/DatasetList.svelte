<script lang="ts">
	export let datasets: Record<string, any>;
	export let selectedDataset: string | null;
	export let onSelectDataset: (dataset: string) => void;

	// Convert the Record to an array for iteration
	$: datasetEntries = Object.keys(datasets);
</script>

<aside class="w-1/4 bg-white p-4 shadow-md">
	<h2 class="mb-4 text-xl font-bold">Datasets</h2>
	{#if datasetEntries.length > 0}
		<ul class="pl-5">
			{#each datasetEntries as datasetName}
				<li>
					<button
						type="button"
						class="cursor-pointer text-gray-700 {datasetName === selectedDataset
							? 'bg-red-500 text-white'
							: ''}"
						on:click={() => onSelectDataset(datasetName)}
					>
						{datasetName}
					</button>
				</li>
			{/each}
		</ul>
	{:else}
		<p class="text-gray-500">No datasets to display.</p>
	{/if}
</aside>
