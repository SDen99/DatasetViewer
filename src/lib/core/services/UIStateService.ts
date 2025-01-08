import type { SortConfig, UIState } from '$lib/core/types';

export class UIStateService {
	private static instance: UIStateService;
	private readonly storageKey = 'sasViewerUIState';
	private cachedState: UIState;

	private constructor() {
		// Initialize state from storage or create new
		const stored = localStorage.getItem(this.storageKey);
		this.cachedState = stored
			? JSON.parse(stored)
			: {
					selectedDataset: null,
					columnStates: {}
				};
	}

	public static getInstance(): UIStateService {
		if (!UIStateService.instance) {
			UIStateService.instance = new UIStateService();
		}
		return UIStateService.instance;
	}

	private getState(): UIState {
		return this.cachedState;
	}

	private setState(state: UIState): void {
		this.cachedState = state;
		// Debounce localStorage writes
		this.debouncedSave();
	}

	// Debounced save to localStorage
	private debouncedSave = (() => {
		let timeoutId: number | null = null;
		return () => {
			if (timeoutId) {
				clearTimeout(timeoutId);
			}
			timeoutId = window.setTimeout(() => {
				localStorage.setItem(this.storageKey, JSON.stringify(this.cachedState));
				timeoutId = null;
			}, 1000); // Save after 1 second of inactivity
		};
	})();

	public getSelectedDataset(): string | null {
		return this.getState().selectedDataset;
	}

	public setSelectedDataset(fileName: string | null): void {
		const state = this.getState();
		state.selectedDataset = fileName;
		this.setState(state);
	}

	public getColumnState(datasetId: string): {
		selectedColumns: string[];
		columnOrder: string[];
		columnWidths: Record<string, number>;
		sort: SortConfig[];
	} {
		const state = this.getState();
		return (
			state.columnStates[datasetId] || {
				selectedColumns: [],
				columnOrder: [],
				columnWidths: {},
				sort: []
			}
		);
	}

	public hasColumnState(datasetId: string): boolean {
		const state = this.getState();
		const columnState = state.columnStates[datasetId];
		return !!(
			columnState &&
			(columnState.selectedColumns.length > 0 ||
				columnState.columnOrder.length > 0 ||
				Object.keys(columnState.columnWidths || {}).length > 0)
		);
	}

	public setColumnState(
		fileName: string,
		selectedColumns: string[],
		columnOrder: string[],
		columnWidths: Record<string, number> = {},
		sort: SortConfig[] = []
	): void {
		const state = this.getState();
		state.columnStates[fileName] = {
			selectedColumns,
			columnOrder,
			columnWidths,
			sort
		};
		this.setState(state);
	}

	public updateColumnWidth(fileName: string, column: string, width: number): void {
		const state = this.getState();
		const columnState = state.columnStates[fileName] || {
			selectedColumns: [],
			columnOrder: [],
			columnWidths: {}
		};

		columnState.columnWidths = {
			...columnState.columnWidths,
			[column]: width
		};

		state.columnStates[fileName] = columnState;
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
		this.setState({
			selectedDataset: null,
			columnStates: {}
		});
	}

	// Add method to handle storage events from other tabs
	public initStorageSync(): void {
		window.addEventListener('storage', (e) => {
			if (e.key === this.storageKey && e.newValue) {
				this.cachedState = JSON.parse(e.newValue);
			}
		});
	}
}
