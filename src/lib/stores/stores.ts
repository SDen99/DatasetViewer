// src/lib/stores.ts
import { writable, derived, get } from 'svelte/store';
import type { Dataset, DatasetLoadingState, ProcessingStats } from '$lib/types';
import { DatasetService } from '../../datasetService';
import { UIStateService } from '../../UIStateService';

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

export const selectedDataset = derived(
    [datasets, selectedDatasetId],
    ([$datasets, $selectedDatasetId]) =>
        $selectedDatasetId ? $datasets[$selectedDatasetId] : null
);

// Store actions
export const datasetActions = {
    selectDataset: (id: string | null) => {
        console.log('Selecting dataset:', id);
        const prevId = get(selectedDatasetId);
        
        // Save current state before switching
        if (prevId) {
            const currentState = {
                selectedColumns: Array.from(get(selectedColumns)),
                columnOrder: get(columnOrder),
                columnWidths: get(columnWidths)
            };
            
            console.log('Saving state for previous dataset:', prevId, currentState);
            UIStateService.getInstance().setColumnState(
                prevId,
                currentState.selectedColumns,
                currentState.columnOrder,
                currentState.columnWidths
            );
        }

        // Set the new dataset ID
        selectedDatasetId.set(id);
        
        if (id) {
            const uiService = UIStateService.getInstance();
            const savedState = uiService.getColumnState(id);
            console.log('Loaded saved state for new dataset:', id, savedState);
            
            const dataset = get(datasets)[id];
            
            if (dataset?.data?.[0]) {
                const allColumns = Object.keys(dataset.data[0]);
                
                if (uiService.hasColumnState(id)) {
                    console.log('Using saved state');
                    // Load saved state
                    selectedColumns.set(new Set(savedState.selectedColumns));
                    columnOrder.set(savedState.columnOrder);
                    columnWidths.set(savedState.columnWidths || {});
                } else {
                    console.log('Initializing default state');
                    // Initialize with defaults
                    selectedColumns.set(new Set(allColumns.slice(0, 5)));
                    columnOrder.set(allColumns);
                    columnWidths.set({});
                }

                // Verify the state was set correctly
                console.log('Current state after setting:', {
                    selectedColumns: get(selectedColumns),
                    columnOrder: get(columnOrder),
                    columnWidths: get(columnWidths)
                });
            }
            
            uiService.setSelectedDataset(id);
        } else {
            // Reset state if no dataset selected
            selectedColumns.set(new Set());
            columnOrder.set([]);
            columnWidths.set({});
            UIStateService.getInstance().setSelectedDataset(null);
        }
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
                selectedColumns.set(new Set());
                columnOrder.set([]);
                columnWidths.set({});
            }
        } catch (error) {
            console.error('Error deleting dataset:', error);
        }
    },

    updateColumnSelection: (column: string, checked: boolean) => {
        const datasetId = get(selectedDatasetId);
        if (!datasetId) return;

        selectedColumns.update(cols => {
            const newCols = new Set(cols);
            if (checked) {
                newCols.add(column);
            } else {
                newCols.delete(column);
            }
            return newCols;
        });

        // Save to UIService
        const currentState = {
            selectedColumns: Array.from(get(selectedColumns)),
            columnOrder: get(columnOrder),
            columnWidths: get(columnWidths)
        };
        
        UIStateService.getInstance().setColumnState(
            datasetId,
            currentState.selectedColumns,
            currentState.columnOrder,
            currentState.columnWidths
        );
    },

    updateColumnOrder: (newOrder: string[]) => {
        const datasetId = get(selectedDatasetId);
        if (!datasetId) return;

        columnOrder.set(newOrder);
        
        // Save to UIService
        const currentState = {
            selectedColumns: Array.from(get(selectedColumns)),
            columnOrder: newOrder,
            columnWidths: get(columnWidths)
        };
        
        UIStateService.getInstance().setColumnState(
            datasetId,
            currentState.selectedColumns,
            currentState.columnOrder,
            currentState.columnWidths
        );
    },

    updateColumnWidth: (column: string, width: number) => {
        const datasetId = get(selectedDatasetId);
        if (!datasetId) return;

        columnWidths.update(widths => ({
            ...widths,
            [column]: width
        }));

        UIStateService.getInstance().updateColumnWidth(
            datasetId,
            column,
            width
        );
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