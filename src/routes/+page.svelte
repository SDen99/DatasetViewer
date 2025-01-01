<script lang="ts">
	import ErrorToast from '$lib/components/ErrorToast.svelte';
	import { errorStore, ErrorSeverity } from '$lib/stores/errorStore';
	import { onMount } from 'svelte';
	import { browser } from '$app/environment';
	import * as Card from '$lib/components/ui/card';

	import Navigation from '$lib/components/Navigation.svelte';
	import MainLayout from '$lib/components/MainLayout.svelte';
	import DatasetList from '$lib/components/DatasetList.svelte';
	import DataTable from '$lib/components/DataTable/DataTable.svelte';
	import VariableList from '$lib/components/VariableList.svelte';
	import Footer from '$lib/components/Footer.svelte';
	import { ServiceContainer } from '$lib/stores/serviceContainer';
	import { DatasetManager } from '$lib/services/DatasetManager';

	import { dataTableStore } from '$lib/stores/dataTableStore.svelte';
	import * as Tabs from '$lib/components/ui/tabs/index.js';
	import MultiColumnSort from '$lib/components/MultiColumnSort.svelte';

	let datasetManager = $state<DatasetManager | null>(null);
	let initializationInProgress = $state(false);

	// Initialize services
	async function initializeApp() {
		if (!browser || initializationInProgress) return;

		initializationInProgress = true;
		try {
			const container = await ServiceContainer.initialize();
			const manager = new DatasetManager(container);

			// Initialize data
			const datasetService = container.getDatasetService();
			const datasets = await datasetService.getAllDatasets();
			dataTableStore.datasets = datasets;

			const selectedId = container.getUIStateService().getSelectedDataset();
			if (selectedId) {
				await dataTableStore.selectDataset(selectedId);
			}

			return manager;
		} catch (error) {
			errorStore.addError({
				message: 'Failed to initialize application services',
				severity: ErrorSeverity.ERROR,
				context: { error }
			});
			return null;
		} finally {
			initializationInProgress = false;
		}
	}

	async function handleFileChangeEvent(event: Event) {
		if (!datasetManager) {
			errorStore.addError({
				message: 'Please wait for application services to initialize',
				severity: ErrorSeverity.WARNING
			});
			return;
		}

		const files = (event.target as HTMLInputElement).files;
		if (!files?.length) return;

		const validFiles = Array.from(files).filter((file) => {
			const validation = datasetManager.validateFile(file);
			if (!validation.valid && validation.error) {
				errorStore.addError({
					message: validation.error,
					severity: ErrorSeverity.WARNING
				});
			}
			return validation.valid;
		});

		if (!validFiles.length) return;

		dataTableStore.setLoadingState(true);

		try {
			const results = await Promise.allSettled(
				validFiles.map((file) => datasetManager.processFile(file))
			);

			const failures = results.filter((r) => r.status === 'fulfilled' && !r.value.success);

			if (failures.length > 0) {
				errorStore.addError({
					message: `Failed to process ${failures.length} file(s)`,
					severity: ErrorSeverity.WARNING,
					context: { failures }
				});
			}
		} finally {
			dataTableStore.setLoadingState(false);
		}
	}

	let isInitializing = $state(false);

	onMount(() => {
		console.log('Component mounted, browser:', browser);
		if (browser) {
			console.log('Starting initialization');
			isInitializing = true;
			initializeApp()
				.then((manager) => {
					console.log('App initialized with manager:', manager);
					if (manager) {
						datasetManager = manager;
					}
				})
				.finally(() => {
					console.log('Initialization complete');
					isInitializing = false;
				});
		}
	});

	$effect(() => {
		$inspect('Page effect running, datasetManager:', datasetManager);
		$inspect('Selected dataset:', dataTableStore.selectedDataset);
	});
</script>

{#if browser}
	{#snippet navigation()}
		<Navigation {handleFileChangeEvent} isLoading={false} />
	{/snippet}

	{#snippet leftbar()}
		<DatasetList />
	{/snippet}

	{#snippet mainContent()}
		{#if dataTableStore.selectedDataset}
			<div class="h-full">
				<Card.Root class="h-full">
					<Card.Content class="h-full p-0">
						<DataTable data={dataTableStore.selectedDataset.data} />
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
			<Tabs.Root value="columns">
				<Tabs.List>
					<Tabs.Trigger value="columns">Column Order</Tabs.Trigger>
					<Tabs.Trigger value="sort">Sort Order</Tabs.Trigger>
				</Tabs.List>
				<Tabs.Content value="columns">
					{#if dataTableStore.selectedDataset}
						<VariableList
							variables={dataTableStore.selectedDataset.details.columns.map((col: string) => ({
								name: col,
								dtype: dataTableStore.selectedDataset!.details.dtypes[col] ?? ''
							}))}
						/>
					{/if}
				</Tabs.Content>
				<Tabs.Content value="sort">
					{#if dataTableStore.selectedDataset}
						<MultiColumnSort
							variables={dataTableStore.selectedDataset.details.columns.map((col: string) => ({
								name: col
							}))}
						/>
					{/if}
				</Tabs.Content>
			</Tabs.Root>
		</div>
	{/snippet}

	{#snippet footer()}
		<Footer />
	{/snippet}

	{#if isInitializing}
		<div class="flex h-full items-center justify-center">
			<p>Initializing application...</p>
		</div>
	{/if}

	<MainLayout {navigation} {leftbar} {mainContent} {rightbar} {footer} />
{/if}
