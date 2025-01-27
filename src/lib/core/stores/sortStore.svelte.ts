import type { SortConfig } from '$lib/core/types/types';
import { StorageService } from '$lib/core/services/StorageServices';

export class SortStore {
	private static instance: SortStore;

	// State
	sort = $state<SortConfig[]>([]);

	private constructor() {
		$effect.root(() => {
		  $effect(() => {
			const datasetId = StorageService.getInstance().loadState().lastSelectedDataset;
			if (!datasetId) return;
	
			const storage = StorageService.getInstance();
			const state = storage.loadState();
			const views = state.datasetViews[datasetId] || {};
	
			storage.saveState({
			  datasetViews: {
				[datasetId]: {
				  ...views,
				  sort: this.sort
				}
			  }
			});
		  });
		});
	  }

	reset() {
		this.sort = [];
	}

	restore(sortConfig: SortConfig[]) {
		this.sort = sortConfig;
	}

	// Alias for restore to maintain consistency with existing code
	setSortConfig(sortConfig: SortConfig[]) {
		this.restore(sortConfig);
	}



	static getInstance(): SortStore {
		if (!SortStore.instance) {
			SortStore.instance = new SortStore();
		}
		return SortStore.instance;
	}

	toggleSort(column: string) {
		const existingSort = this.sort.find((s) => s.column === column);

		if (existingSort) {
			if (existingSort.direction === 'asc') {
				this.updateSort(column, 'desc');
			} else {
				this.removeSort(column);
			}
		} else {
			this.addSort(column);
		}
	}

	addSort(column: string) {
		this.sort = [...this.sort, { column, direction: 'asc' }];
	}

	updateSort(column: string, direction: 'asc' | 'desc') {
		this.sort = this.sort.map((s) => (s.column === column ? { ...s, direction } : s));
	}

	removeSort(column: string) {
		this.sort = this.sort.filter((s) => s.column !== column);
	}
}

export const sortStore = SortStore.getInstance();
