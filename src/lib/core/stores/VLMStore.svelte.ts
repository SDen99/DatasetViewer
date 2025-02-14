// VLMStore.svelte.ts
import { StorageService } from '$lib/core/services/StorageServices';

export class VLMStore {
	private static instance: VLMStore;

	// State per dataset
	columnWidths = $state<Record<string, Record<string, number>>>({});
	columnOrder = $state<Record<string, string[]>>({});

	private constructor() {
		console.log('VLMStore initialized');
	}

	static getInstance(): VLMStore {
		if (!VLMStore.instance) {
			VLMStore.instance = new VLMStore();
		}
		return VLMStore.instance;
	}

	initialize(datasetId: string, columns: string[]) {
		if (!this.columnWidths[datasetId]) {
			this.columnWidths = {
				...this.columnWidths,
				[datasetId]: {}
			};
		}
		if (!this.columnOrder[datasetId]) {
			this.columnOrder = {
				...this.columnOrder,
				[datasetId]: columns
			};
		}
	}

	updateColumnWidth(datasetId: string, column: string, width: number) {
		// Create new references for reactivity
		const datasetWidths = {
			...(this.columnWidths[datasetId] || {}),
			[column]: width
		};

		this.columnWidths = {
			...this.columnWidths,
			[datasetId]: datasetWidths
		};
	}

	updateColumnOrder(datasetId: string, newOrder: string[]) {
		this.columnOrder = {
			...this.columnOrder,
			[datasetId]: newOrder
		};
	}

	getColumnWidths(datasetId: string): Record<string, number> {
		return this.columnWidths[datasetId] || {};
	}

	getColumnOrder(datasetId: string): string[] {
		return this.columnOrder[datasetId] || [];
	}

	reset(datasetId: string) {
		const { [datasetId]: _, ...rest } = this.columnWidths;
		this.columnWidths = rest;

		const { [datasetId]: __, ...restOrder } = this.columnOrder;
		this.columnOrder = restOrder;
	}
}

export const vlmStore = VLMStore.getInstance();
