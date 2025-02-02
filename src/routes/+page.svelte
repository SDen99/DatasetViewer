<script lang="ts">
	import { onMount } from 'svelte';
	import { browser } from '$app/environment';
	import * as Card from '$lib/components/core/card';

	import Navigation from '$lib/components/layout/Navigation.svelte';
	import MainLayout from '$lib/components/layout//MainLayout.svelte';
	import DataTable from '$lib/components/data/DataTable/DataTable.svelte';
	import VariableList from '$lib/components/VariableList.svelte';
	import Footer from '$lib/components/Footer.svelte';
	import DataAnalysis from '$lib/components/data/DataAnalysis.svelte';

	import { FileImportManager } from '$lib/core/services/FileImportManager';
	import { initManager } from '$lib/core/services/InitializationService.svelte';
	import { datasetStore } from '$lib/core/stores/datasetStore.svelte';
	import { uiStore } from '$lib/core/stores/UIStore.svelte';
	import { errorStore, ErrorSeverity } from '$lib/core/stores/errorStore';

	import * as Tabs from '$lib/components/core/tabs/index.js';
	import MultiColumnSort from '$lib/components/MultiColumnSort.svelte';
	import DataXmlList from '$lib/components/data/DataXmlList.svelte';
	import MetadataView from '$lib/components/data/MetadataView.svelte';

	let FileManager = $state<FileImportManager | null>(null);
	let isLoading = $derived(
		datasetStore.isLoading || Object.keys(datasetStore.loadingDatasets).length > 0
	);
	let initializationError = $state<Error | null>(null);

	async function handleFileChangeEvent(event: Event) {
		if (!FileManager) {
			errorStore.addError({
				message: 'Please wait for application services to initialize',
				severity: ErrorSeverity.WARNING
			});
			return;
		}
		{
			const dm = FileManager;
			const files = (event.target as HTMLInputElement).files;
			if (!files?.length) return;

			const validFiles = Array.from(files).filter((file) => {
				const validation = dm.validateFile(file);
				if (!validation.valid && validation.error) {
					errorStore.addError({
						message: validation.error,
						severity: ErrorSeverity.WARNING
					});
				}
				return validation.valid;
			});

			if (!validFiles.length) return;

			datasetStore.setLoadingState(true);

			try {
				const results = await Promise.allSettled(validFiles.map((file) => dm.processFile(file)));

				const failures = results.filter((r) => r.status === 'fulfilled' && !r.value.success);

				if (failures.length > 0) {
					errorStore.addError({
						message: `Failed to process ${failures.length} file(s)`,
						severity: ErrorSeverity.WARNING,
						context: { failures }
					});
				}
			} finally {
				datasetStore.setLoadingState(false);
			}
		}
	}

	async function initializeApp() {
		try {
			console.log('Starting initialization...');
			await initManager.initialize();
			const container = initManager.status.container;

			if (!container) {
				console.error('Container is null after initialization');
				throw new Error('Failed to initialize application container');
			}

			console.log('Creating FileImportManager with container');
			FileManager = new FileImportManager(container);
			console.log('FileImportManager created successfully');
		} catch (error) {
			console.error('Detailed initialization error:', error);
			if (error instanceof Error) {
				console.error('Stack trace:', error.stack);
			}
			initializationError = error instanceof Error ? error : new Error(String(error));
			errorStore.addError({
				message: 'Failed to initialize application',
				severity: ErrorSeverity.ERROR,
				context: { error: initializationError }
			});
		}
	}

	onMount(() => {
		if (browser) {
			initializeApp();
		}
	});

	let selectedDataset = $derived.by(() => {
		if (!datasetStore.selectedDatasetId) return null;
		return datasetStore.datasets[datasetStore.selectedDatasetId];
	});

	let hasDefineXml = $derived.by(() => {
		return uiStore.uiState.SDTM || uiStore.uiState.ADaM;
	});

	let defineXmlFiles = $derived(datasetStore.defineXmlDatasets);

	$effect(() => {
		console.log('hasDefineXml', hasDefineXml);
	});
</script>

{#snippet navigation()}
	<Navigation {handleFileChangeEvent} {isLoading} />
{/snippet}

{#snippet leftbar()}
	<DataXmlList />
{/snippet}

{#snippet mainContent()}
	{#if selectedDataset}
		<div class="h-full">
			<Card.Root class="h-full">
				<Card.Content class="h-full p-0">
					<DataTable data={selectedDataset.data} />
				</Card.Content>
			</Card.Root>
		</div>
	{:else}
		<div class="flex flex-1 items-center justify-center">
			<div class="text-center text-muted-foreground">
				<h3 class="text-lg font-medium">No dataset selected</h3>
				<p class="text-sm">Select a dataset from the sidebar to view its contents</p>
			</div>
		</div>
	{/if}
{/snippet}

{#snippet rightbar()}
	<div class="h-full">
		{#if selectedDataset && selectedDataset.data}
			<Tabs.Root value="columns">
				<Tabs.List>
					<Tabs.Trigger value="columns">Column Order</Tabs.Trigger>
					<Tabs.Trigger value="sort">Sort Order</Tabs.Trigger>
					<Tabs.Trigger value="analysis">Analysis</Tabs.Trigger>
				</Tabs.List>
				<Tabs.Content value="columns">
					<VariableList
						variables={selectedDataset.details.columns.map((col: string) => ({
							name: col,
							dtype: selectedDataset.details.dtypes[col] ?? ''
						}))}
					/>
				</Tabs.Content>
				<Tabs.Content value="sort">
					<MultiColumnSort
						variables={selectedDataset.details.columns.map((col: string) => ({
							name: col
						}))}
					/>
				</Tabs.Content>
				<Tabs.Content value="analysis">
					<DataAnalysis />
				</Tabs.Content>
			</Tabs.Root>
		{/if}
	</div>
{/snippet}

{#snippet footer()}
	<Footer />
{/snippet}

{#if browser}
	{#if initManager.status.status === 'initializing'}
		<div class="flex h-full flex-col items-center justify-center gap-2">
			<p class="text-lg font-medium">Initializing application...</p>
			{#if initManager.status.progress}
				<p class="text-sm text-muted-foreground">
					{initManager.status.progress.message}
				</p>
			{/if}
		</div>
	{:else if initializationError}
		<div class="flex h-full flex-col items-center justify-center gap-4">
			<p class="text-lg font-medium text-destructive">Failed to initialize application</p>
			<p class="text-sm text-muted-foreground">
				{initializationError.message}
			</p>
			<button
				class="btn variant-filled"
				onclick={() => {
					initializationError = null;
					initializeApp();
				}}
			>
				Retry
			</button>
		</div>
	{:else if initManager.status.status === 'ready'}
		<MainLayout {navigation} {leftbar} {mainContent} {rightbar} {footer} />
	{/if}
{/if}
