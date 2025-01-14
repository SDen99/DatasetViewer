export interface BaseProcessingResult {}

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
	data: any;
}

// Union type for all processing results
export type ProcessingResult = Sas7bdatProcessingResult | DefineXMLProcessingResult;
