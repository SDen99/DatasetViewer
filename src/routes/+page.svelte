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
	const selectedColumns = writable<Set<string>>(new Set());

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
			setLoadingState(true);
			const startTime = performance.now();
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
			const endTime = performance.now();
			setUploadTime(`Upload and processing time: ${(endTime - startTime) / 1000} seconds`);
			setLoadingState(false);
		}
	}

	function handleCheckboxChange(event: Event) {
		const checkbox = event.target as HTMLInputElement;
		selectedColumns.update((columns) => {
			if (checkbox.checked) {
				columns.add(checkbox.value);
			} else {
				columns.delete(checkbox.value);
			}
			return columns;
		});
	}

	function isColumnSelected(column: string): boolean {
		return $selectedColumns.has(column);
	}

	// get data from the selected dataset
	let selectedDataset: any = null;

	$: {
		if ($selectedDatasetStore) {
			console.log('selectedDatasetStore', $selectedDatasetStore);
			console.log('$datasetsStore', $datasetsStore);
			selectedDataset = $datasetsStore.get($selectedDatasetStore);
			console.log('selectedDataset', selectedDataset);
		} else {
			selectedDataset = null;
		}
	}

	// Initialize selectedColumns with all column names when a dataset is selected
	$: if (selectedDataset) {
		selectedColumns.set(new Set(Object.keys(selectedDataset.data[0] || {})));
	}

	// Reactive block to log selectedDataset whenever it changes
	$: {
		console.log(selectedDataset, $selectedDatasetStore);
	}
</script>

<main class="flex min-h-screen flex-col bg-gray-100">
	<!-- Navigation Bar -->
	<nav class="w-full bg-blue-500 p-4 text-white">
		<h1 class="text-2xl font-bold">Upload .sas7bdat Files</h1>
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
				<div class="h-8 w-8 animate-spin rounded-full border-4 border-dashed border-white"></div>
				<div>Loading...</div>
			</div>
		{/if}
	</nav>

	<!-- Container for Left Sidebar, Main Content, and Right Sidebar -->
	<div class="flex flex-1">
		<!-- Left Sidebar for Datasets List -->
		<aside class="w-1/4 bg-white p-4 shadow-md">
			<h2 class="mb-4 text-xl font-bold">Datasets</h2>
			{#if $datasetsStore.size > 0}
				<ul class="list-disc pl-5">
					{#each Array.from($datasetsStore.keys()) as datasetName}
						<li>
							<button
								type="button"
								class="cursor-pointer text-gray-700 {datasetName === $selectedDatasetStore
									? 'bg-red-500 text-white'
									: ''}"
								on:click={() => selectedDatasetStore.set(datasetName)}
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

		<!-- Main Content Area -->
		<section class="flex-1 p-4">
			<!-- Display the file content as a table -->
			{#if selectedDataset}
				{#if selectedDataset.data.length > 0}
					<table class="min-w-full bg-white">
						<thead>
							<tr>
								{#each Object.keys(selectedDataset.data[0] || {}) as key}
									{#if $selectedColumns.has(key)}
										<th
											class="border-b border-gray-200 bg-gray-100 px-4 py-2 text-left text-sm font-semibold text-gray-700"
											>{key}</th
										>
									{/if}
								{/each}
							</tr>
						</thead>
						<tbody>
							{#each selectedDataset.data.slice(0, 50) as row}
								<!--limit to 50 rows -->
								<tr>
									{#each Object.entries(row) as [key, value]}
										{#if $selectedColumns.has(key)}
											<td class="border-b border-gray-200 px-4 py-2 text-sm text-gray-700"
												>{value}</td
											>
										{/if}
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

		<!-- Right Sidebar for Variables List -->
		<aside class="w-1/4 bg-white p-4 shadow-md">
			{#if selectedDataset}
				<h2 class="mb-4 text-xl font-bold">Variables</h2>
				<ul class="list-disc pl-5">
					{#each selectedDataset.details.columns as variable}
						<li>
							<label>
								<input
									type="checkbox"
									name={variable}
									value={variable}
									on:change={handleCheckboxChange}
									checked={isColumnSelected(variable)}
								/>
								{variable}
							</label>
						</li>
					{/each}
				</ul>
			{:else}
				<p class="text-gray-500">Select a dataset to view variables.</p>
			{/if}
		</aside>
	</div>

	<!-- Footer -->
	<footer class="flex w-full items-center justify-between bg-gray-800 p-4 text-white">
		<div>
			{#if $uploadTimeStore}
				<p class="text-sm">Upload and processing time: {$uploadTimeStore}</p>
			{/if}
		</div>
		<div>
			{#if selectedDataset}
				<p class="text-sm">
					Variables: {selectedDataset.details.num_columns}
					Records: {selectedDataset.details.num_rows}
				</p>
			{/if}
		</div>
	</footer>
</main>
