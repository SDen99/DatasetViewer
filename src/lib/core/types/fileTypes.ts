import type { DatasetLoadingState, ProcessingResult } from './types';

export enum FileType {
	SAS7BDAT = 'SAS7BDAT',
	DEFINEXML = 'DEFINEXML'
}

export interface ValidationResult {
	valid: boolean;
	error?: string;
	fileType?: FileType;
}

export interface FileProcessor {
	validateFile(file: File): ValidationResult;
	processFile(
		file: File,
		onProgress?: (state: DatasetLoadingState) => void
	): Promise<ProcessingResult>;
}
