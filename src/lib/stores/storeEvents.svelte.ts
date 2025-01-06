import { datasetStore } from './datasetStore.svelte';
import { tableUIStore } from './tableUIStore.svelte';
import { sortStore } from './sortStore.svelte';
import { UIStateService } from '../../UIStateService';

export class StoreEvents {
	static datasetSelected(datasetId: string | null) {
		if (!datasetId) {
			tableUIStore.reset();
			sortStore.reset();
			return;
		}

		const dataset = datasetStore.datasets[datasetId];
		if (dataset?.data?.[0]) {
			const uiService = UIStateService.getInstance();
			const state = uiService.getColumnState(datasetId);

			if (uiService.hasColumnState(datasetId)) {
				tableUIStore.restore({
					selectedColumns: state.selectedColumns,
					columnOrder: state.columnOrder,
					columnWidths: state.columnWidths
				});
				sortStore.setSortConfig(state.sort || []);
			} else {
				const columns = Object.keys(dataset.data[0]);
				tableUIStore.initialize(columns);
				sortStore.reset();
			}
		}
	}
}
