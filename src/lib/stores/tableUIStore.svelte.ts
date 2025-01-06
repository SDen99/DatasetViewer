import type { Dataset } from '$lib/types';
import { UIStateService } from '../../UIStateService';
import { datasetStore } from './datasetStore.svelte';

export class TableUIStore {
	private static instance: TableUIStore;

	// State
	selectedColumns = $state<Set<string>>(new Set());
	columnOrder = $state<string[]>([]);
	columnWidths = $state<Record<string, number>>({});
	uiState = $state({
		leftSidebarOpen: true,
		rightSidebarOpen: true
	});

	constructor() {
		// Create an effect root to handle store initialization
		$effect.root(() => {
			$effect(() => {
				const datasetId = datasetStore.selectedDatasetId;
				if (datasetId) {
					UIStateService.getInstance().setColumnState(
						datasetId,
						Array.from(this.selectedColumns),
						this.columnOrder,
						this.columnWidths
					);
				}
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
		// By default, show first 5 columns
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

	initializeColumns(dataset: Dataset) {
		if (!dataset?.data?.[0]) return;

		const allColumns = Object.keys(dataset.data[0]);
		const uiService = UIStateService.getInstance();

		if (uiService.hasColumnState(dataset.fileName)) {
			const state = uiService.getColumnState(dataset.fileName);
			this.selectedColumns = new Set(state.selectedColumns);
			this.columnOrder = state.columnOrder;
			this.columnWidths = state.columnWidths || {};
		} else {
			this.selectedColumns = new Set(allColumns.slice(0, 5));
			this.columnOrder = allColumns;
			this.columnWidths = {};
		}
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

	toggleSidebar(side: 'left' | 'right') {
		this.uiState = {
			...this.uiState,
			[`${side}SidebarOpen`]: !this.uiState[`${side}SidebarOpen`]
		};
	}

	updateColumnWidth(column: string, width: number) {
		this.columnWidths = {
			...this.columnWidths,
			[column]: width
		};
	}
}

export const tableUIStore = TableUIStore.getInstance();
