<script lang="ts">
    import  ErrorToast  from '$lib/components/ErrorToast.svelte';
    import { errorStore, withErrorHandling, ErrorSeverity } from '$lib/stores/errorStore';
	import { onMount, onDestroy } from 'svelte';
	import { browser } from '$app/environment';
	import * as Card from '$lib/components/ui/card';
	import type { DatasetLoadingState } from '$lib/types';

	import Navigation from '$lib/components/Navigation.svelte';
	import MainLayout from '$lib/components/MainLayout.svelte';
	import DatasetList from '$lib/components/DatasetList.svelte';
	import DataTable from '$lib/components/DataTable.svelte';
	import VariableList from '$lib/components/VariableList.svelte';
	import Footer from '$lib/components/Footer.svelte';
	import { ServiceContainer } from '$lib/stores/serviceContainer';

	import {
		datasets,
		selectedDataset,
		loadingDatasets,
		isLoading,
		datasetActions
	} from '$lib/stores/stores';

	// Service instances
	let serviceContainer: ServiceContainer;
    let servicesInitialized = false;

    let initializationInProgress = false;
    const MAX_FILE_SIZE = 500 * 1024 * 1024; 

async function initializeServices() {
    if (!browser || initializationInProgress) return;
    
    initializationInProgress = true;
    try {
        serviceContainer = await ServiceContainer.initialize();
        const datasetService = serviceContainer.getDatasetService();
        const initialDatasets = await datasetService.getAllDatasets();
        datasets.set(initialDatasets);

        const selectedId = serviceContainer.getUIStateService().getSelectedDataset();
        if (selectedId) {
            await datasetActions.selectDataset(selectedId);
        }

        servicesInitialized = true;
    } catch (error) {
        console.error('Service initialization error:', error);
        errorStore.addError({
            message: 'Failed to initialize application services',
            severity: ErrorSeverity.ERROR,
            context: { error }
        });
    } finally {
        initializationInProgress = false;
    }
}

onMount(() => {
    initializeServices();
});

onDestroy(() => {
    if (serviceContainer) {
        serviceContainer.dispose();
    }
});

async function handleFileChangeEvent(event: Event) {
    if (!servicesInitialized) {
        errorStore.addError({
            message: 'Please wait for application services to initialize',
            severity: ErrorSeverity.WARNING
        });
        return;
    }

    const files = (event.target as HTMLInputElement).files;
    if (!files?.length) return;

    const validFiles = Array.from(files).filter(file => {
        if (file.size > MAX_FILE_SIZE) {
            errorStore.addError({
                message: `File ${file.name} exceeds maximum size limit of 100MB`,
                severity: ErrorSeverity.WARNING
            });
            return false;
        }
        if (!file.name.endsWith('.sas7bdat')) {
            errorStore.addError({
                message: `File ${file.name} is not a valid SAS dataset`,
                severity: ErrorSeverity.WARNING
            });
            return false;
        }
        return true;
    });

    if (!validFiles.length) return;

    datasetActions.setLoadingState(true);
    
    try {
        // Process files concurrently
        const processingPromises = validFiles.map(async (file) => {
            try {
                loadingDatasets.update(state => ({
                    ...state,
                    [file.name]: { status: 'queued', fileName: file.name }
                }));

                const result = await processFile(file);
                await handleProcessingSuccess(file, result);
                return { file, status: 'success' };
            } catch (error) {
                handleProcessingError(file, error);
                return { file, status: 'error', error };
            }
        });

        const results = await Promise.allSettled(processingPromises);
        
        // Count failures
        const failures = results.filter(
            r => r.status === 'fulfilled' && r.value.status === 'error'
        );
        
        if (failures.length > 0) {
            errorStore.addError({
                message: `Failed to process ${failures.length} file(s)`,
                severity: ErrorSeverity.WARNING,
                context: { failures }
            });
        }

        // Refresh dataset list after all processing is complete
        const datasetService = serviceContainer.getDatasetService();
        const updatedDatasets = await datasetService.getAllDatasets();
        datasets.set(updatedDatasets);
        
    } catch (error) {
        console.error('File processing error:', error);
        errorStore.addError({
            message: 'Error processing files',
            severity: ErrorSeverity.ERROR,
            context: { error }
        });
    } finally {
        datasetActions.setLoadingState(false);
    }
}

async function processFile(file: File) {
    const workerPool = serviceContainer.getWorkerPool();
    if (!workerPool) {
        throw new Error('Worker pool not initialized');
    }

    return workerPool.processFile(
        file,
        file.name,
        (state: DatasetLoadingState) => {
            loadingDatasets.update((current) => ({
                ...current,
                [file.name]: state
            }));
        }
    );
}

async function handleProcessingSuccess(file: File, result: any) {
    const datasetService = serviceContainer.getDatasetService(); // Get from container
    
    const processingStats = {
        uploadTime: Number(result.processingTime?.toFixed(2)),
        numColumns: result.details?.num_columns,
        numRows: result.details?.num_rows,
        datasetSize: file.size
    };

    datasetActions.updateProcessingStats(processingStats);

    await datasetService.addDataset({
        fileName: file.name,
        ...result,
        processingStats
    });

    // Update datasets store
    const updatedDatasets = await datasetService.getAllDatasets();
    datasets.set(updatedDatasets);

    // Clear loading state
    loadingDatasets.update((state) => {
        const newState = { ...state };
        delete newState[file.name];
        return newState;
    });
}

	function handleProcessingError(file: File, error: Error) {
		loadingDatasets.update((state) => ({
			...state,
			[file.name]: {
				...state[file.name],
				status: 'error',
				error: error.message
			}
		}));
	}


</script>

{#if browser}
<MainLayout>
	{#snippet navigation()}
        <Navigation  {handleFileChangeEvent} isLoading={$isLoading} />
      {/snippet}
	
	<!-- Left Sidebar Content -->
	<!-- @migration-task: migrate this slot by hand, `left-sidebar` is an invalid identifier -->
  {#snippet leftbar()}
      
  	  <DatasetList />
  	
      {/snippet}
	
	<!-- Main Content -->
  {#snippet maincontent()}
      
  	  {#if $selectedDataset}
  		<div class="h-full">
  		  <Card.Root class="h-full">
  			<Card.Content class="h-full p-0">
  			  <DataTable data={$selectedDataset.data} />
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
	
	<!-- Right Sidebar Content -->
  {#snippet rightbar()}
      
  		{#if $selectedDataset}
  		<VariableList
  		variables={$selectedDataset.details.columns.map((col: string) => ({
  		  name: col,
  		  dtype: $selectedDataset.details.dtypes[col]
  		}))}
  	  />
  	  {/if}
  	
      {/snippet}


	{#snippet footer()}
        <Footer  />
      {/snippet}
  </MainLayout>
  <ErrorToast/>
  {/if}
