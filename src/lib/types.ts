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
}

export interface PyodideInterface {
    loadPackage: (name: string) => Promise<void>;
    runPythonAsync: (code: string) => Promise<string>;
    FS: {
        writeFile: (path: string, data: Uint8Array) => void;
    };
}
