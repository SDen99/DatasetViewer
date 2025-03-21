import type { ParsedDefineXML } from '$lib/types/define-xml';

// Graph data structure definition
export interface GraphData {
	nodes: Array<{
		id: string;
		group: number;
		label: string;
	}>;
	links: Array<{
		source: string;
		target: string;
		value: number;
		relationship: string;
	}>;
}

export interface BaseProcessingResult {
	success: boolean;
	error?: string;
	processingTime?: number; // Adding a common processingTime field
}

// SAS7bdat specific result - unchanged
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

// Define XML specific result - updated to include graphData
export interface DefineXMLProcessingResult extends BaseProcessingResult {
	data: ParsedDefineXML;
	metrics?: {
		uploadTime: number;
		fileSize: number;
	};
	ADaM: boolean;
	SDTM: boolean;
	details?: {
		num_rows: number;
		num_columns: number;
		columns: string[];
		dtypes: Record<string, string>;
		summary?: Record<string, any>;
	};
	graphData?: GraphData | null; // Add graph data to Define XML results
}

// Union type for all processing results
export type ProcessingResult = Sas7bdatProcessingResult | DefineXMLProcessingResult;
