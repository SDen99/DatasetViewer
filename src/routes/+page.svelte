<script lang="ts">
	import { onMount } from 'svelte';
	import { get, writable } from 'svelte/store';
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
	const selectedColumnsStore = writable<Map<string, Set<string>>>(new Map());
	const columnOrderStore = writable<Map<string, string[]>>(new Map());

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
		selectedColumnsStore.update((selectedColumns) => {
			const currentDataset = $selectedDatasetStore;
			if (currentDataset) {
				let columns = selectedColumns.get(currentDataset) || new Set();
				if (checked) {
					columns.add(column);
				} else {
					columns.delete(column);
				}
				selectedColumns.set(currentDataset, columns);
			}
			return selectedColumns;
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

	function handleColumnReorder(newOrder: string[]) {
		const currentDataset = $selectedDatasetStore;
		if (currentDataset) {
			columnOrderStore.update((orders) => {
				orders.set(currentDataset, newOrder);
				return orders;
			});
		}
	}

	// Initialize columnOrder when a dataset is selected
	$: if (selectedDataset) {
		const currentDataset = $selectedDatasetStore;
		if (currentDataset) {
			const allColumns = Object.keys(selectedDataset.data[0] || {});
			const initialColumns = new Set(allColumns.slice(0, 5)); // Take first 5 columns

			// Update selectedColumns
			selectedColumnsStore.update((selectedColumns) => {
				selectedColumns.set(currentDataset, initialColumns);
				return selectedColumns;
			});

			// Update columnOrder (maintain full list of columns for ordering)
			columnOrderStore.update((orders) => {
				if (!orders.has(currentDataset)) {
					orders.set(currentDataset, allColumns);
				}
				return orders;
			});
		}
	}
</script>

<main class="flex min-h-screen flex-col bg-gray-100">
	<Navigation {handleFileChangeEvent} isLoading={$isLoadingStore} />

	<div class="flex flex-1 overflow-hidden">
		<DatasetList
			datasets={$datasetsStore}
			selectedDataset={$selectedDatasetStore}
			onSelectDataset={(dataset) => selectedDatasetStore.set(dataset)}
		/>

		<section class="flex-1 overflow-x-auto p-4">
			{#if selectedDataset}
				<DataTable
					data={selectedDataset.data}
					selectedColumns={$selectedDatasetStore
						? ($selectedColumnsStore.get($selectedDatasetStore) ?? new Set())
						: new Set()}
					columnOrder={$selectedDatasetStore
						? ($columnOrderStore.get($selectedDatasetStore) ?? [])
						: []}
					onReorderColumns={handleColumnReorder}
				/>
			{/if}
		</section>

		{#if selectedDataset}
			<VariableList
				variables={selectedDataset.details.columns}
				selectedColumns={$selectedDatasetStore
					? ($selectedColumnsStore.get($selectedDatasetStore) ?? new Set())
					: new Set()}
				columnOrder={$selectedDatasetStore
					? ($columnOrderStore.get($selectedDatasetStore) ?? [])
					: []}
				onColumnToggle={handleColumnToggle}
				onReorderVariables={handleColumnReorder}
			/>
		{/if}
	</div>

	<Footer
		class="fixed bottom-0 left-0 right-0 w-full bg-gray-800 p-4 text-white"
		uploadTime={selectedDataset?.processingTime.toFixed(2)}
		numColumns={selectedDataset?.details.num_columns}
		numRows={selectedDataset?.details.num_rows}
	/>
</main>
