import type { ParsedDefineXML } from '$lib/core/processors/defineXML/ParseDefineXML';
export interface BaseProcessingResult {
	success: boolean;
	error?: string;
}

// SAS7bdat specific result
export interface Sas7bdatProcessingResult extends BaseProcessingResult {
	data: any[];
	metrics: {
		uploadTime: number;
		datasetSize: number;
		processingTime: number;
	};
	details: {
		columns: string[];
		dtypes: Record<string, string>;
		num_rows: number;
		num_columns: number;
		summary?: Record<string, any>;
		unique_values?: Record<string, any[]>;
	};
}

// Define XML specific result
export interface DefineXMLProcessingResult extends BaseProcessingResult {
	data: ParsedDefineXML;
	metrics?: {
		processingTime: number;
		fileSize: number;
	};
}

// Union type for all processing results
export type ProcessingResult = Sas7bdatProcessingResult | DefineXMLProcessingResult;
