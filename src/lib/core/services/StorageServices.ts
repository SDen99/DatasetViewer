import type { SortConfig } from '../types/types';
import { StorageQueue } from '$lib/core/services/StorageQueue';
import type { UIState } from '$lib/core/stores/UIStore.svelte';

interface DatasetViewState {
	selectedColumns: string[];
	columnOrder: string[];
	columnWidths: Record<string, number>;
	sort: SortConfig[];
}

interface AppPersistentState {
	lastSelectedDataset: string | null;
	datasetViews: Record<string, DatasetViewState>;
	uiPreferences: UIState;
}

export class StorageService {
	public static readonly STORAGE_KEY = 'sas-viewer-state';
	private static instance: StorageService | null = null;
	private readonly queue: StorageQueue;

	private constructor() {
		this.queue = StorageQueue.getInstance();
		if (!localStorage.getItem(StorageService.STORAGE_KEY)) {
			this.saveState(this.getDefaultState());
		}
	}
	static getInstance(): StorageService {
		if (!StorageService.instance) {
			StorageService.instance = new StorageService();
		}
		return StorageService.instance;
	}

	private getDefaultState(): AppPersistentState {
		return {
			lastSelectedDataset: null,
			datasetViews: {},
			uiPreferences: {
				leftSidebarOpen: true,
				rightSidebarOpen: true,
				leftSidebarWidth: 320,
				rightSidebarWidth: 320,
				viewMode: 'data',
				SDTM: false,
				ADaM: false
			}
		};
	}

	loadState(): AppPersistentState {
		const stored = localStorage.getItem(StorageService.STORAGE_KEY);
		return stored ? JSON.parse(stored) : this.getDefaultState();
	}

	async saveState(state: Partial<AppPersistentState>): Promise<void> {
		await this.queue.enqueue(async () => {
			const current = this.loadState();
			const updated = { ...current, ...state };
			localStorage.setItem(StorageService.STORAGE_KEY, JSON.stringify(updated));
		});
	}
}
