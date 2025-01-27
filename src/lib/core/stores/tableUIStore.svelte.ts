import { StorageService } from '$lib/core/services/StorageServices';

export class TableUIStore {
	private static instance: TableUIStore;

	// State with initialization from StorageService
	selectedColumns = $state<Set<string>>(new Set());
	columnOrder = $state<string[]>([]);
	columnWidths = $state<Record<string, number>>({});

	private constructor() {
		$effect.root(() => {
		  // Persist state changes to storage
		  $effect(() => {
			const datasetId = StorageService.getInstance().loadState().lastSelectedDataset;
			if (!datasetId) return;
	
			StorageService.getInstance().saveState({
			  datasetViews: {
				[datasetId]: {
				  selectedColumns: Array.from(this.selectedColumns),
				  columnOrder: this.columnOrder,
				  columnWidths: this.columnWidths,
				  sort: [] // Will be populated by sortStore
				}
			  }
			});
		  });
		});
	  }
	

	reset() {
		this.selectedColumns = new Set();
		this.columnOrder = [];
		this.columnWidths = {};
	}

	restore(state: {
		selectedColumns: string[];
		columnOrder: string[];
		columnWidths: Record<string, number>;
	}) {
		this.selectedColumns = new Set(state.selectedColumns);
		this.columnOrder = state.columnOrder;
		this.columnWidths = state.columnWidths || {};
	}

	initialize(columns: string[]) {
		this.selectedColumns = new Set(columns.slice(0, 5));
		this.columnOrder = columns;
		this.columnWidths = {};
	}

	static getInstance(): TableUIStore {
		if (!TableUIStore.instance) {
			TableUIStore.instance = new TableUIStore();
		}
		return TableUIStore.instance;
	}

	updateColumnSelection(column: string, checked: boolean) {
		const newSet = new Set(this.selectedColumns);
		if (checked) {
			newSet.add(column);
		} else {
			newSet.delete(column);
		}
		this.selectedColumns = newSet;
	}

	updateColumnOrder(newOrder: string[]) {
		this.columnOrder = newOrder;
	}

	updateColumnWidth(column: string, width: number) {
		this.columnWidths = {
			...this.columnWidths,
			[column]: width
		};
	}
}

export const tableUIStore = TableUIStore.getInstance();
