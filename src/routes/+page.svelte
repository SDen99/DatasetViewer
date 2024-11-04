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

	onMount(async () => {
		if (!isPyodideLoaded) {
			try {
				pyodideReadyPromise = await initializePyodide();
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
			setNumRecords,
			pyodideReadyPromise
		);
	}
</script>

<main class="flex min-h-screen flex-col items-center justify-center bg-gray-100">
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
		<pre class="rounded bg-white p-4 text-left shadow-md">{$fileContentStore}</pre>
	{/if}
</main>
