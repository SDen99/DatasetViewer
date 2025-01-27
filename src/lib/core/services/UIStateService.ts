import type { SortConfig } from '$lib/core/types/types';
import { StorageService } from '$lib/core/services/StorageServices';
export class UIStateService {
	private static instance: UIStateService;
	private readonly storageKey = 'dataset-view-state';

	public static getInstance(): UIStateService {
		if (!UIStateService.instance) {
			UIStateService.instance = new UIStateService();
		}
		return UIStateService.instance;
	}

	private getColumnState(datasetId: string) {
		const storage = StorageService.getInstance();
		const state = storage.loadState();
		return (
			state.datasetViews[datasetId] || {
				selectedColumns: [],
				columnOrder: [],
				columnWidths: {},
				sort: []
			}
		);
	}

	public hasColumnState(datasetId: string): boolean {
		const state = this.getColumnState(datasetId);
		return !!(
			state.selectedColumns.length > 0 ||
			state.columnOrder.length > 0 ||
			Object.keys(state.columnWidths || {}).length > 0
		);
	}

	public setColumnState(
		fileName: string,
		selectedColumns: string[],
		columnOrder: string[],
		columnWidths: Record<string, number> = {},
		sort: SortConfig[] = []
	): void {
		const storage = StorageService.getInstance();
		storage.saveState({
			datasetViews: {
				[fileName]: {
					selectedColumns,
					columnOrder,
					columnWidths,
					sort
				}
			}
		});
	}

	public updateColumnWidth(fileName: string, column: string, width: number): void {
		const state = this.getColumnState(fileName);
		const storage = StorageService.getInstance();

		storage.saveState({
			datasetViews: {
				[fileName]: {
					...state,
					columnWidths: {
						...state.columnWidths,
						[column]: width
					}
				}
			}
		});
	}

	public clearStateForDataset(fileName: string): void {
		const storage = StorageService.getInstance();
		const state = storage.loadState();

		const { [fileName]: _, ...rest } = state.datasetViews;
		storage.saveState({ datasetViews: rest });
	}

	public clearAll(): void {
		const storage = StorageService.getInstance();
		storage.saveState({ datasetViews: {} });
	}

	public initStorageSync(): void {
		window.addEventListener('storage', (e) => {
			if (e.key === StorageService.STORAGE_KEY) {
				StorageService.getInstance().loadState();
			}
		});
	}
}
