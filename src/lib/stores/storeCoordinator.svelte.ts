import { datasetStore } from './datasetStore.svelte';
import { tableUIStore } from './tableUIStore.svelte';
import { sortStore } from './sortStore.svelte';
import { UIStateService } from '../../UIStateService';

export class StoreCoordinator {
	private static instance: StoreCoordinator;

	static getInstance(): StoreCoordinator {
		if (!StoreCoordinator.instance) {
			StoreCoordinator.instance = new StoreCoordinator();
		}
		return StoreCoordinator.instance;
	}

	private constructor() {
		// Set up state persistence effect
		$effect.root(() => {
			$effect(() => {
				const datasetId = datasetStore.selectedDatasetId;
				if (!datasetId) return;

				const state = {
					selectedColumns: Array.from(tableUIStore.selectedColumns),
					columnOrder: tableUIStore.columnOrder,
					columnWidths: tableUIStore.columnWidths,
					sort: sortStore.sort
				};

				UIStateService.getInstance().setColumnState(
					datasetId,
					state.selectedColumns,
					state.columnOrder,
					state.columnWidths,
					state.sort
				);
			});
		});
	}

	selectDataset(id: string | null) {
		const prevId = datasetStore.selectedDatasetId;

		// Save previous state if exists
		if (prevId) {
			this.saveCurrentState(prevId);
		}

		// Load new state
		if (id) {
			const state = UIStateService.getInstance().getColumnState(id);
			tableUIStore.restore({
				selectedColumns: state.selectedColumns,
				columnOrder: state.columnOrder,
				columnWidths: state.columnWidths
			});
			sortStore.restore(state.sort);
		} else {
			tableUIStore.reset();
			sortStore.reset();
		}

		// Update dataset selection last
		datasetStore.selectedDatasetId = id;
	}

	private saveCurrentState(datasetId: string) {
		const state = {
			selectedColumns: Array.from(tableUIStore.selectedColumns),
			columnOrder: tableUIStore.columnOrder,
			columnWidths: tableUIStore.columnWidths,
			sort: sortStore.sort
		};

		UIStateService.getInstance().setColumnState(
			datasetId,
			state.selectedColumns,
			state.columnOrder,
			state.columnWidths,
			state.sort
		);
	}
}

export const storeCoordinator = StoreCoordinator.getInstance();
