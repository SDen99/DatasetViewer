<script lang="ts">
	import { onMount } from 'svelte';
	import { handleFileChange } from '$lib/fileHandler';
	import { processSasFile } from '$lib/sasProcessor';
	import { initializePyodide } from '$lib/pyodideInitializer';
	import { writable } from 'svelte/store';

	let pyodideReadyPromise: Promise<any> | null = null;
	let isPyodideLoaded = false;

	const datasetsStore = writable<Map<string, any>>(new Map());
	const selectedDatasetStore = writable<string | null>(null);
	const isLoadingStore = writable(false);
	const uploadTimeStore = writable('');

	function setLoadingState(state: boolean) {
		isLoadingStore.set(state);
	}

	function setUploadTime(time: string) {
		uploadTimeStore.set(time);
	}

	onMount(async () => {
		if (!isPyodideLoaded) {
			try {
				console.log('Initializing Pyodide...');
				pyodideReadyPromise = initializePyodide();
				await pyodideReadyPromise;
				isPyodideLoaded = true;
				console.log('Pyodide loaded successfully');
			} catch (error) {
				console.error('Error loading Pyodide:', error);
			}
		}
	});

	async function handleFileChangeEvent(event: Event) {
		const input = event.target as HTMLInputElement;
		const files = input.files;
		if (files) {
			for (const file of files) {
				await handleFileChange(
					file,
					processSasFile,
					setLoadingState,
					setUploadTime,
					datasetsStore,
					pyodideReadyPromise
				);
			}
		}
	}

	// get data from the selected dataset
	$: selectedDataset = $selectedDatasetStore ? $datasetsStore.get($selectedDatasetStore) : null;
</script>

<main class="flex min-h-screen bg-gray-100">
	<!-- Sidebar for Datasets List -->
	<aside class="w-1/4 bg-white p-4 shadow-md">
		<h2 class="mb-4 text-xl font-bold">Datasets</h2>
		{#if $datasetsStore.size > 0}
			<ul class="list-disc pl-5">
				{#each Array.from($datasetsStore.keys()) as datasetName}
					<button
						type="button"
						class="cursor-pointer text-gray-700"
						on:click={() => selectedDatasetStore.set(datasetName)}
					>
						{datasetName}
					</button>
					<br />
				{/each}
			</ul>
		{:else}
			<p class="text-gray-500">No datasets to display.</p>
		{/if}
	</aside>

	<!-- Main Content Area -->
	<section class="flex-1 p-4">
		<h1 class="mb-4 text-2xl font-bold">Upload .sas7bdat Files</h1>
		<input
			type="file"
			accept=".sas7bdat"
			on:change={handleFileChangeEvent}
			multiple
			class="mb-4 rounded border border-gray-300 p-2"
		/>
		{#if $isLoadingStore}
			<!-- Display a loading indicator -->
			<div class="flex items-center justify-center space-x-2">
				<div class="h-8 w-8 animate-spin rounded-full border-4 border-dashed border-blue-500"></div>
				<div>Loading...</div>
			</div>
		{/if}
		{#if $uploadTimeStore}
			<p class="text-lg text-gray-700">{$uploadTimeStore}</p>
		{/if}
		{#if selectedDataset}
			<p class="text-lg text-gray-700">
				Number of Variables: {selectedDataset.details.num_columns}
			</p>
			<p class="text-lg text-gray-700">Number of Records: {selectedDataset.details.num_rows}</p>

			<!-- Display the variables list -->
			<h2 class="mb-2 mt-4 text-xl font-bold">Variables</h2>
			<ul class="list-disc pl-5">
				{#each selectedDataset.details.columns as variable}
					<li class="text-gray-700">{variable}</li>
				{/each}
			</ul>

			<!-- Display the file content as a table -->
			{#if selectedDataset.data.length > 0}
				<table class="min-w-full bg-white">
					<thead>
						<tr>
							{#each Object.keys(selectedDataset.data[0] || {}) as key}
								<th
									class="border-b border-gray-200 bg-gray-100 px-4 py-2 text-left text-sm font-semibold text-gray-700"
									>{key}</th
								>
							{/each}
						</tr>
					</thead>
					<tbody>
						{#each selectedDataset.data.slice(0, 50) as row}
							<!--limit to 50 rows -->
							<tr>
								{#each Object.values(row) as value}
									<td class="border-b border-gray-200 px-4 py-2 text-sm text-gray-700">{value}</td>
								{/each}
							</tr>
						{/each}
					</tbody>
				</table>
			{:else}
				<p class="text-gray-500">No data to display.</p>
			{/if}
		{/if}
	</section>
</main>
