<script>
	import { onMount } from 'svelte';

	let fileName = '';
	let fileContent = '';
	let uploadTime = '';
	let isLoading = false; // Add a loading state
	let pyodideReadyPromise;

	onMount(async () => {
		try {
			// Ensure loadPyodide is defined
			if (typeof loadPyodide === 'undefined') {
				throw new Error('loadPyodide is not defined. Ensure Pyodide is correctly loaded.');
			}

			pyodideReadyPromise = loadPyodide({
				indexURL: 'https://cdn.jsdelivr.net/pyodide/v0.18.1/full/'
				// If using local files, use the following line instead
				// indexURL: '/pyodide-0.26.3/'
			});
			await pyodideReadyPromise;
			console.log('Pyodide loaded successfully');
		} catch (error) {
			console.error('Error loading Pyodide:', error);
		}
	});

	async function handleFileChange(event) {
		const file = event.target.files[0];
		if (file && file.name.endsWith('.sas7bdat')) {
			fileName = file.name;
			const reader = new FileReader();
			const startTime = new Date(); // Start the timer
			isLoading = true; // Set loading state to true
			reader.onload = async () => {
				try {
					const arrayBuffer = reader.result;
					const jsonData = await processSasFile(arrayBuffer);
					fileContent = JSON.stringify(jsonData, null, 2);
					const endTime = new Date(); // End the timer
					const timeDiff = endTime - startTime; // Time difference in milliseconds
					uploadTime = `Upload and processing time: ${(timeDiff / 1000).toFixed(2)} seconds`;
				} catch (error) {
					console.error('Error processing SAS file:', error);
					fileContent = 'Error processing SAS file.';
				} finally {
					isLoading = false; // Set loading state to false
				}
			};
			reader.readAsArrayBuffer(file);
		} else {
			fileName = 'Invalid file type. Please select a .sas7bdat file.';
		}
	}

	async function processSasFile(arrayBuffer) {
		try {
			const pyodide = await pyodideReadyPromise;
			await pyodide.loadPackage('pandas');
			const uint8Array = new Uint8Array(arrayBuffer);
			pyodide.FS.writeFile('/tmpfile.sas7bdat', uint8Array);
			const code = `
import pandas as pd
import warnings

# Check if lzma is available
try:
    import lzma
except ImportError:
    warnings.warn("lzma module is not available. Attempting to read the file without lzma support.")

df = pd.read_sas('/tmpfile.sas7bdat', format='sas7bdat')
df.to_json(orient='records')
            `;
			const jsonData = await pyodide.runPythonAsync(code);
			return JSON.parse(jsonData);
		} catch (error) {
			console.error('Error in processSasFile:', error);
			throw error;
		}
	}
</script>

<main class="flex min-h-screen flex-col items-center justify-center bg-gray-100">
	<h1 class="mb-4 text-2xl font-bold">Upload a .sas7bdat File</h1>
	<input
		type="file"
		accept=".sas7bdat"
		on:change={handleFileChange}
		class="mb-4 rounded border border-gray-300 p-2"
	/>
	{#if fileName}
		<p class="text-lg text-gray-700">Selected file: {fileName}</p>
	{/if}
	{#if isLoading}
		<!-- Display a loading indicator -->
		<div class="loader">Loading...</div>
	{/if}
	{#if uploadTime}
		<p class="text-lg text-gray-700">{uploadTime}</p>
	{/if}
	{#if fileContent}
		<pre class="rounded bg-white p-4 text-left shadow-md">{fileContent}</pre>
	{/if}
</main>

<style>
	.loader {
		border: 16px solid #f3f3f3;
		border-radius: 50%;
		border-top: 16px solid #3498db;
		width: 120px;
		height: 120px;
		animation: spin 2s linear infinite;
	}

	@keyframes spin {
		0% {
			transform: rotate(0deg);
		}
		100% {
			transform: rotate(360deg);
		}
	}
</style>
