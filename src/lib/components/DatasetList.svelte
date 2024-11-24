<script lang="ts">
	export let datasets: Map<string, any>;
	export let selectedDataset: string | null;
	export let onSelectDataset: (dataset: string) => void;
</script>

<aside class="w-1/4 bg-white p-4 shadow-md">
	<h2 class="mb-4 text-xl font-bold">Datasets</h2>
	{#if datasets.size > 0}
		<ul class="pl-5">
			{#each Array.from(datasets.keys()) as datasetName}
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
