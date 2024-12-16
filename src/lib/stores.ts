// src/lib/stores.ts
import { writable, derived, get } from 'svelte/store';
import type { Dataset, DatasetLoadingState, ProcessingStats } from '$lib/types';
import { DatasetService } from '../datasetService';
import { UIStateService } from '../UIStateService';


function initializeColumnState(dataset: Dataset, columnState: any) {
    if (!dataset?.data?.[0]) return;

    const defaultColumns = Object.keys(dataset.data[0]);

    // Set column order
    columnOrder.set(
        columnState.columnOrder.length > 0
            ? columnState.columnOrder
            : defaultColumns
    );

    // Set selected columns
    selectedColumns.set(new Set());  // Reset first
    if (columnState.selectedColumns.length > 0) {
        columnState.selectedColumns.forEach((col: string) => {
            datasetActions.updateColumnSelection(col, true);
        });
    } else {
        defaultColumns.slice(0, 5).forEach(col => {
            datasetActions.updateColumnSelection(col, true);
        });
    }
}


// Create the individual stores
export const datasets = writable<Record<string, Dataset>>({});
export const selectedDatasetId = writable<string | null>(null);
export const selectedColumns = writable<Set<string>>(new Set());
export const columnOrder = writable<string[]>([]);
export const columnWidths = writable<Record<string, number>>({});
export const isLoading = writable(false);
export const loadingDatasets = writable<Record<string, DatasetLoadingState>>({});
export const uiState = writable({
    leftSidebarOpen: true,
    rightSidebarOpen: true
});
export const processingStats = writable<ProcessingStats>({
    uploadTime: null,
    numColumns: null,
    numRows: null,
    datasetSize: null
});

// Derived store for selected dataset
export const selectedDataset = derived(
    [datasets, selectedDatasetId],
    ([$datasets, $selectedDatasetId]) =>
        $selectedDatasetId ? $datasets[$selectedDatasetId] : null
);

// Store actions
export const datasetActions = {
    selectDataset: (id: string | null) => {
        selectedDatasetId.set(id);
        // Reset column state when changing datasets
        selectedColumns.set(new Set());
        columnOrder.set([]);
        columnWidths.set({});
    },

    deleteDataset: async (id: string) => {
        try {
            await DatasetService.getInstance().removeDataset(id);
            await UIStateService.getInstance().clearStateForDataset(id);

            const $datasets = get(datasets);
            const newDatasets = { ...$datasets };
            delete newDatasets[id];
            datasets.set(newDatasets);

            if (get(selectedDatasetId) === id) {
                selectedDatasetId.set(null);
            }
        } catch (error) {
            console.error('Error deleting dataset:', error);
        }
    },

    updateColumnSelection: (column: string, checked: boolean) => {
        selectedColumns.update(cols => {
            const newCols = new Set(cols);
            if (checked) {
                newCols.add(column);
            } else {
                newCols.delete(column);
            }
            return newCols;
        });
    },

    updateColumnOrder: (newOrder: string[]) => {
        columnOrder.set(newOrder);
    },

    updateColumnWidth: (column: string, width: number) => {
        columnWidths.update(widths => ({
            ...widths,
            [column]: width
        }));
    },

    toggleSidebar: (side: 'left' | 'right') => {
        uiState.update(state => ({
            ...state,
            [`${side}SidebarOpen`]: !state[`${side}SidebarOpen`]
        }));
    },

    setLoadingState: (loading: boolean) => {
        isLoading.set(loading);
    },

    updateProcessingStats: (stats: Partial<ProcessingStats>) => {
        processingStats.update(current => ({
            ...current,
            ...stats
        }));
    }


};