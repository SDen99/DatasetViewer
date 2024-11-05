<script lang="ts">
	import { onMount } from 'svelte';
	import { handleFileChange } from '$lib/fileHandler';
	import { processSasFile } from '$lib/sasProcessor';
	import { initializePyodide } from '$lib/pyodideInitializer';
	import { writable } from 'svelte/store';

	let pyodideReadyPromise: Promise<any> | null = null;
	let isPyodideLoaded = false;

	const fileNameStore = writable('');
	const fileContentStore = writable('');
	const uploadTimeStore = writable('');
	const isLoadingStore = writable(false);
	const numVariablesStore = writable(0);
	const numRecordsStore = writable(0);
	const variablesStore = writable<string[]>([]);
	const uniqueValuesStore = writable<{ [key: string]: string[] }>({});

	function setLoadingState(state: boolean) {
		isLoadingStore.set(state);
	}

	function setFileName(name: string) {
		fileNameStore.set(name);
	}

	function setFileContent(content: string) {
		fileContentStore.set(content);
	}

	function setUploadTime(time: string) {
		uploadTimeStore.set(time);
	}

	function setNumVariables(num: number) {
		numVariablesStore.set(num);
	}

	function setNumRecords(num: number) {
		numRecordsStore.set(num);
	}

	function setVariables(variables: string[]) {
		variablesStore.set(variables);
	}

	function setUniqueValues(uniqueValues: { [key: string]: string[] }) {
		uniqueValuesStore.set(uniqueValues);
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
		await handleFileChange(
			event,
			processSasFile,
			setLoadingState,
			setFileName,
			setFileContent,
			setUploadTime,
			setNumVariables,
			setVariables,
			setNumRecords,
			setUniqueValues,
			pyodideReadyPromise
		);
	}
	// Parse the JSON data from fileContentStore
	$: parsedData = $fileContentStore ? JSON.parse($fileContentStore) : [];
	console.log('parsedData:', parsedData);
</script>

<main class="flex min-h-screen bg-gray-100">
	<!-- Sidebar for Variables List -->
	<aside class="w-1/4 bg-white p-4 shadow-md">
		<h2 class="mb-4 text-xl font-bold">Variables</h2>
		{#if $variablesStore.length > 0}
			<ul class="list-disc pl-5">
				{#each $variablesStore as variable}
					<li class="text-gray-700">{variable}</li>
				{/each}
			</ul>
		{:else}
			<p class="text-gray-500">No variables to display.</p>
		{/if}
	</aside>

	<!-- Main Content Area -->
	<section class="flex-1 p-4">
		<h1 class="mb-4 text-2xl font-bold">Upload a .sas7bdat File</h1>
		<input
			type="file"
			accept=".sas7bdat"
			on:change={handleFileChangeEvent}
			class="mb-4 rounded border border-gray-300 p-2"
		/>
		{#if $fileNameStore}
			<p class="text-lg text-gray-700">Selected file: {$fileNameStore}</p>
		{/if}
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
		{#if $fileContentStore}
			<p class="text-lg text-gray-700">Number of Variables: {$numVariablesStore}</p>
			<p class="text-lg text-gray-700">Number of Records: {$numRecordsStore}</p>
			<!-- Display the file content as a table -->
			{#if parsedData.length > 0}
				<table class="min-w-full bg-white">
					<thead>
						<tr>
							{#each Object.keys(parsedData[0] || {}) as key}
								<th
									class="border-b border-gray-200 bg-gray-100 px-4 py-2 text-left text-sm font-semibold text-gray-700"
									>{key}</th
								>
							{/each}
						</tr>
					</thead>
					<tbody>
						{#each parsedData.slice(0, 50) as row}
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
