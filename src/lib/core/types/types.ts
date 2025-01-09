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

export interface WorkerTask {
	id: string;
	file: ArrayBuffer | null;
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
	processingStats: ProcessingStats;
}
export interface DatasetLoadingState {
	progress: number; // 0 to 100
	fileName: string;
	totalSize: number;
	loadedSize: number;
	status: 'queued' | 'loading' | 'processing' | 'complete' | 'error';
	error?: string;
}
export type SortConfig = {
	column: string;
	direction: 'asc' | 'desc';
};

export interface PersistedState {
	selectedColumns: string[];
	columnOrder: string[];
	columnWidths: Record<string, number>;
	sort: SortConfig[];
}

export interface UIState {
	selectedDataset: string | null;
	columnStates: Record<
		string,
		{
			selectedColumns: string[];
			columnOrder: string[];
			columnWidths: Record<string, number>;
			sort: SortConfig[];
		}
	>;
}

import type { WorkerPool } from '../../../workerPool';
import type { DatasetService } from '../services/datasetService';
import type { UIStateService } from '../services/UIStateService';

export interface ServiceContainer {
	getWorkerPool(): WorkerPool;
	getDatasetService(): DatasetService;
	getUIStateService(): UIStateService;
	dispose(): void;
}

export type InitState = {
	status: 'idle' | 'initializing' | 'ready' | 'error';
	container: ServiceContainer | null;
	error?: Error;
	progress: {
		step: 'services' | 'dataset' | 'ui'; // Removed 'workers' since we're not using it
		message: string;
	} | null;
};
