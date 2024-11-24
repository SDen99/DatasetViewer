<script lang="ts">
	import { onMount } from 'svelte';
	import { writable } from 'svelte/store';
	import Navigation from '$lib/components/Navigation.svelte';
	import DatasetList from '$lib/components/DatasetList.svelte';
	import DataTable from '$lib/components/DataTable.svelte';
	import VariableList from '$lib/components/VariableList.svelte';
	import Footer from '$lib/components/Footer.svelte';
	import { handleFileChange } from '$lib/fileHandler';
	import { processSasFile } from '$lib/sasProcessor';
	import { initializePyodide } from '$lib/pyodideInitializer';

	let pyodideReadyPromise: Promise<any> | null = null;
	let isPyodideLoaded = false;

	const datasetsStore = writable<Map<string, any>>(new Map());
	const selectedDatasetStore = writable<string | null>(null);
	const isLoadingStore = writable(false);
	const uploadTimeStore = writable<number | null>(null);
	const selectedColumns = writable<Set<string>>(new Set());

	function setLoadingState(state: boolean) {
		isLoadingStore.set(state);
	}

	function setUploadTime(time: number) {
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
			setUploadTime(parseFloat(((endTime - startTime) / 1000).toFixed(2)));
			setLoadingState(false);
		}
	}

	function handleColumnToggle(column: string, checked: boolean) {
		selectedColumns.update((columns) => {
			if (checked) {
				columns.add(column);
			} else {
				columns.delete(column);
			}
			return columns;
		});
	}

	let selectedDataset: any = null;

	$: {
		if ($selectedDatasetStore) {
			selectedDataset = $datasetsStore.get($selectedDatasetStore);
		} else {
			selectedDataset = null;
		}
	}

	$: if (selectedDataset) {
		selectedColumns.set(new Set(Object.keys(selectedDataset.data[0] || {})));
	}
</script>

<main class="flex min-h-screen flex-col bg-gray-100">
	<Navigation {handleFileChangeEvent} isLoading={$isLoadingStore} />

	<div class="flex flex-1">
		<DatasetList
			datasets={$datasetsStore}
			selectedDataset={$selectedDatasetStore}
			onSelectDataset={(dataset) => selectedDatasetStore.set(dataset)}
		/>

		<section class="flex-1 p-4">
			{#if selectedDataset}
				<DataTable data={selectedDataset.data} selectedColumns={$selectedColumns} />
			{/if}
		</section>

		{#if selectedDataset}
			<VariableList
				variables={selectedDataset.details.columns}
				selectedColumns={$selectedColumns}
				onColumnToggle={handleColumnToggle}
			/>
		{/if}
	</div>

	<Footer
		uploadTime={$uploadTimeStore}
		numColumns={selectedDataset?.details.num_columns}
		numRows={selectedDataset?.details.num_rows}
	/>
</main>
