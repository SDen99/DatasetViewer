import type { DatasetLoadingState } from '$lib/core/types/types';

export interface ProcessingMetrics {
	uploadTime: number;
	datasetSize: number;
	processingTime: number;
}

export interface ValidationResult {
	valid: boolean;
	error?: string;
}

export interface ProcessingResult {
	data: any[];
	details: {
		columns: string[];
		dtypes: Record<string, string>;
		num_rows: number;
		num_columns: number;
		summary?: Record<string, any>; // Made optional since we'll move stats later
	};
	metrics: ProcessingMetrics;
}
