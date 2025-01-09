import type { FileProcessor, ValidationResult, ProcessingResult } from '$lib/core/processors/types';
import type { DatasetLoadingState } from '$lib/core/types/types';
import type { WorkerPool } from '../../../../workerPool';

const FILE_CONSTRAINTS = {
	MAX_SIZE: 500 * 1024 * 1024,
	EXTENSION: '.sas7bdat'
} as const;

export class Sas7bdatProcessor implements FileProcessor {
	private workerPool: WorkerPool;

	constructor() {
		const workerURL = new URL('./sas7bdat.worker.js', import.meta.url).href;
		this.workerPool = new WorkerPool(workerURL);
	}

	validateFile(file: File): ValidationResult {
		if (file.size > FILE_CONSTRAINTS.MAX_SIZE) {
			return {
				valid: false,
				error: `File ${file.name} exceeds maximum size limit of 500MB`
			};
		}

		if (!file.name.endsWith(FILE_CONSTRAINTS.EXTENSION)) {
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
			const arrayBuffer = await file.arrayBuffer();
			const result = await this.processWithWorker(arrayBuffer);

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

	private processWithWorker(arrayBuffer: ArrayBuffer): Promise<any> {
		return new Promise((resolve, reject) => {
			const taskId = crypto.randomUUID();

			const handleMessage = (event: MessageEvent) => {
				const { type, taskId: responseId, result, error } = event.data;

				if (responseId !== taskId) return;

				this.worker.removeEventListener('message', handleMessage);

				if (type === 'PROCESSING_ERROR') {
					reject(new Error(error));
				} else if (type === 'PROCESSING_COMPLETE') {
					resolve(result);
				}
			};

			this.worker.addEventListener('message', handleMessage);

			this.worker.postMessage({
				type: 'PROCESS_FILE',
				taskId,
				file: arrayBuffer
			});
		});
	}
}
