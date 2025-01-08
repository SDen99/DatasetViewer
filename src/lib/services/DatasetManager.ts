import type { DatasetLoadingState, ServiceContainer } from '$lib/types';
import { datasetStore } from '$lib/stores/datasetStore.svelte';

export const FILE_CONSTRAINTS = {
	MAX_SIZE: 500 * 1024 * 1024,
	ALLOWED_EXTENSIONS: ['.sas7bdat']
} as const;

export class DatasetManager {
	private serviceContainer: ServiceContainer;

	constructor(serviceContainer: ServiceContainer) {
		this.serviceContainer = serviceContainer;
	}

	validateFile(file: File): { valid: boolean; error?: string } {
		if (file.size > FILE_CONSTRAINTS.MAX_SIZE) {
			return {
				valid: false,
				error: `File ${file.name} exceeds maximum size limit of 500MB`
			};
		}

		if (!file.name.endsWith('.sas7bdat')) {
			return {
				valid: false,
				error: `File ${file.name} is not a valid SAS dataset`
			};
		}

		return { valid: true };
	}

	async processFile(file: File): Promise<{ success: boolean; error?: Error }> {
		const workerPool = this.serviceContainer.getWorkerPool();
		if (!workerPool) {
			throw new Error('Worker pool not initialized');
		}

		try {
			datasetStore.updateLoadingDatasetState(file.name, {
				status: 'queued',
				fileName: file.name,
				progress: 0,
				totalSize: file.size,
				loadedSize: 0
			});

			const result = await workerPool.processFile(file, file.name, (state: DatasetLoadingState) => {
				datasetStore.updateLoadingDatasetState(file.name, state);
			});

			await this.handleProcessingSuccess(file, result);
			return { success: true };
		} catch (error) {
			this.handleProcessingError(file, error);
			return { success: false, error: error instanceof Error ? error : new Error(String(error)) };
		}
	}

	private async handleProcessingSuccess(file: File, result: any) {
		const datasetService = this.serviceContainer.getDatasetService();

		const processingStats = {
			uploadTime: Number(result.processingTime?.toFixed(2)),
			numColumns: result.details?.num_columns,
			numRows: result.details?.num_rows,
			datasetSize: file.size
		};

		await datasetService.addDataset({
			fileName: file.name,
			...result,
			processingStats
		});

		const updatedDatasets = await datasetService.getAllDatasets();
		datasetStore.setDatasets(updatedDatasets);
		datasetStore.updateLoadingDatasets(file.name);
		datasetStore.updateProcessingStats(processingStats);
	}

	private handleProcessingError(file: File, error: unknown) {
		const finalError = error instanceof Error ? error : new Error(String(error));
		datasetStore.setLoadingDatasetError(file.name, finalError);
	}
}
