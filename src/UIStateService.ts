interface UIState {
    selectedDataset: string | null;
    columnStates: Record<string, {
        selectedColumns: string[];
        columnOrder: string[];
    }>;
}

export class UIStateService {
    private static instance: UIStateService;
    private readonly storageKey = 'sasViewerUIState';

    private constructor() {
        // Initialize with empty state if none exists
        if (!this.getState()) {
            this.setState({
                selectedDataset: null,
                columnStates: {}
            });
        }
    }

    public static getInstance(): UIStateService {
        if (!UIStateService.instance) {
            UIStateService.instance = new UIStateService();
        }
        return UIStateService.instance;
    }

    private getState(): UIState {
        const stored = localStorage.getItem(this.storageKey);
        return stored ? JSON.parse(stored) : null;
    }

    private setState(state: UIState): void {
        localStorage.setItem(this.storageKey, JSON.stringify(state));
    }

    public getSelectedDataset(): string | null {
        return this.getState().selectedDataset;
    }

    public setSelectedDataset(fileName: string | null): void {
        const state = this.getState();
        state.selectedDataset = fileName;
        this.setState(state);
    }

    public getColumnState(fileName: string) {
        const state = this.getState();
        return state.columnStates[fileName] || {
            selectedColumns: [],
            columnOrder: []
        };
    }

    public setColumnState(
        fileName: string,
        selectedColumns: string[],
        columnOrder: string[]
    ): void {
        const state = this.getState();
        state.columnStates[fileName] = { selectedColumns, columnOrder };
        this.setState(state);
    }

    public clearStateForDataset(fileName: string): void {
        const state = this.getState();
        delete state.columnStates[fileName];
        if (state.selectedDataset === fileName) {
            state.selectedDataset = null;
        }
        this.setState(state);
    }

    public clearAll(): void {
        localStorage.removeItem(this.storageKey);
    }
}