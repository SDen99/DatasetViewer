import type { DatasetLoadingState, ServiceContainer } from '$lib/core/types/types';
import { datasetStore } from '$lib/core/stores/datasetStore.svelte';
import { FileType, type FileProcessor } from '$lib/core/types/fileTypes';
import { Sas7bdatProcessor } from '$lib/core/processors/sas7bdat/Sas7bdatProcessor';
import { DefineXMLProcessor } from '$lib/core/processors/defineXML/DefineXMLProcessor';

export const FILE_CONSTRAINTS = {
	MAX_SIZE: 500 * 1024 * 1024,
	ALLOWED_EXTENSIONS: ['.sas7bdat', '.xml']
} as const;

export class FileImportManager {
	private serviceContainer: ServiceContainer;
	private processors: Map<FileType, FileProcessor>;

	constructor(serviceContainer: ServiceContainer) {
		this.serviceContainer = serviceContainer;
		const workerPool = serviceContainer.getWorkerPool();

		this.processors = new Map<FileType, FileProcessor>([
			[FileType.SAS7BDAT, new Sas7bdatProcessor(workerPool)],
			[FileType.DEFINEXML, new DefineXMLProcessor()]
		]);
	}

	validateFile(file: File): { valid: boolean; error?: string } {
		if (file.size > FILE_CONSTRAINTS.MAX_SIZE) {
			return {
				valid: false,
				error: `File ${file.name} exceeds maximum size limit of 500MB`
			};
		}

		// Try each processor until we find one that accepts the file
		for (const processor of this.processors.values()) {
			const result = processor.validateFile(file);
			if (result.valid) return result;
		}

		return {
			valid: false,
			error: `File ${file.name} is not a supported file type`
		};
	}

	async processFile(file: File): Promise<{ success: boolean; error?: Error }> {
		let processorToUse: FileProcessor | undefined;

		// Find the appropriate processor
		for (const processor of this.processors.values()) {
			const result = processor.validateFile(file);
			if (result.valid) {
				processorToUse = processor;
				break;
			}
		}

		if (!processorToUse) {
			return {
				success: false,
				error: new Error('No processor found for file type')
			};
		}

		try {
			datasetStore.updateLoadingDatasetState(file.name, {
				status: 'queued',
				fileName: file.name,
				progress: 0,
				totalSize: file.size,
				loadedSize: 0
			});

			const result = await processorToUse.processFile(file, (state: DatasetLoadingState) => {
				datasetStore.updateLoadingDatasetState(file.name, state);
			});

			await this.handleProcessingSuccess(file, result);
			return { success: true };
		} catch (error) {
			this.handleProcessingError(file, error);
			return {
				success: false,
				error: error instanceof Error ? error : new Error(String(error))
			};
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
