export interface ProcessingResult {
	details: {
		num_rows: number;
		num_columns: number;
		columns: string[];
		dtypes: Record<string, string>;
		summary: Record<string, any>;
		unique_values: Record<string, any[]>;
	};
	data: any[];
	processingTime: number;
}

export interface PyodideInterface {
	loadPackage: (name: string) => Promise<void>;
	runPythonAsync: (code: string) => Promise<string>;
	FS: {
		writeFile: (path: string, data: Uint8Array) => void;
	};
}

export interface DatasetLoadingState {
	progress: number; // 0 to 100
	fileName: string;
	totalSize: number;
	loadedSize: number;
	status: 'loading' | 'processing' | 'complete' | 'error';
	error?: string;
}

export interface WorkerTask {
	id: string;
	file: ArrayBuffer;
	fileName: string;
	resolve: (result: ProcessingResult) => void;
	reject: (error: Error) => void;
}

export interface ManagedWorker {
	worker: Worker;
	busy: boolean;
	lastUsed: number;
	pyodideReady: boolean;
}

export interface ProcessingStats {
	uploadTime: number | null;
	numColumns: number | null;
	numRows: number | null;
	datasetSize: number | null;
}

export interface VariableType {
	name: string;
	dtype: string;
}

export interface Dataset {
	fileName: string;
	data: any[];
	details: {
		columns: string[];
		dtypes: Record<string, string>;
		num_columns: number;
		num_rows: number;
	};
	processingStats: {
		uploadTime: number;
		numColumns: number;
		numRows: number;
		datasetSize: number;
	};
}

export interface DatasetLoadingState {
	progress: number;
	fileName: string;
	totalSize: number;
	loadedSize: number;
	status: 'loading' | 'error' | 'complete';
	error?: string;
}
