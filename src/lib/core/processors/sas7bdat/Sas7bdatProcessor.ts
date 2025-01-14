import type { ProcessingResult } from '$lib/core/processors/types';
import type { FileProcessor, ValidationResult } from '$lib/core/types/fileTypes';
import type { DatasetLoadingState } from '$lib/core/types/types';
import { WorkerPool } from '../../../../workerPool';

const FILE_CONSTRAINTS = {
	MAX_SIZE: 500 * 1024 * 1024, // 500MB
	EXTENSION: '.sas7bdat'
} as const;

export class Sas7bdatProcessor implements FileProcessor {
	private workerPool: WorkerPool;

	constructor(workerPool: WorkerPool) {
		if (!workerPool) {
			throw new Error('WorkerPool is required for Sas7bdatProcessor');
		}
		this.workerPool = workerPool;
	}

	validateFile(file: File): ValidationResult {
		if (file.size > FILE_CONSTRAINTS.MAX_SIZE) {
			return {
				valid: false,
				error: `File ${file.name} exceeds maximum size limit of 500MB`
			};
		}

		if (!file.name.toLowerCase().endsWith(FILE_CONSTRAINTS.EXTENSION)) {
			return {
				valid: false,
				error: `File ${file.name} is not a valid SAS dataset`
			};
		}

		return { valid: true };
	}

	async processFile(
		file: File,
		onProgress?: (state: DatasetLoadingState) => void
	): Promise<ProcessingResult> {
		const startTime = performance.now();

		if (onProgress) {
			onProgress({
				status: 'processing',
				fileName: file.name,
				progress: 0,
				totalSize: file.size,
				loadedSize: 0
			});
		}

		try {
			const result = await this.workerPool.processFile(file, file.name, onProgress ?? (() => {}));

			const processingTime = (performance.now() - startTime) / 1000;

			return {
				...result,
				metrics: {
					uploadTime: processingTime,
					datasetSize: file.size,
					processingTime
				}
			};
		} catch (error) {
			if (onProgress) {
				onProgress({
					status: 'error',
					fileName: file.name,
					error: error instanceof Error ? error.message : String(error),
					progress: 0,
					totalSize: file.size,
					loadedSize: 0
				});
			}
			throw error;
		}
	}
}
