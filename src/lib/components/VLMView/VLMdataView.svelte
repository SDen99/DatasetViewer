<script lang="ts">
	import { createVLMProcessor } from '$lib/core/processors/defineXML/VLM/VLMProcessor.svelte';
	import { vlmStore } from '$lib/core/stores/VLMStore.svelte';
	import { normalizeDatasetId } from '$lib/core/utils/datasetUtils';
	import { Alert, AlertDescription } from '$lib/components/core/alert';
	import VLMFilterControls from './VLMFilterControls.svelte';
	import VLMTable from './VLMTable.svelte';
	import type { ParsedDefineXML } from '$lib/types/define-xml';

	let {
		define: activeDefine,
		defineType,
		datasetName
	} = $props<{
		define: ParsedDefineXML | null;
		defineType: 'SDTM' | 'ADaM' | null;
		datasetName: string;
	}>();

	const processor = createVLMProcessor();
	let processingError = $state<string | null>(null);
	let cleanDatasetName = $state('');
	let displayData = $state<{
		hasData: boolean;
		columns?: string[];
		rows?: any[];
	}>({ hasData: false });
	
	// PARAMCD filter
	let paramcdFilter = $state('');

	// Column visibility state
	let visibleColumnState = $state<Record<string, boolean>>({});

	// Track stratification columns
	let stratificationColumns = $state<Set<string>>(new Set());

	// Calculate if all columns are hidden using derived state
	function calculateAllColumnsHidden() {
		if (!displayData?.columns) return false;

		const nonFixedColumns = displayData.columns.filter(
			(col) => !['PARAMCD', 'PARAM'].includes(col)
		);

		return (
			nonFixedColumns.length > 0 &&
			nonFixedColumns.every((col) => {
				return visibleColumnState[col] === false;
			})
		);
	}

	// Derive allColumnsHidden from the state
	let allColumnsHidden = $derived(calculateAllColumnsHidden());

	// Get visible columns as a derived value
	function getVisibleColumns() {
		if (!displayData.columns) return [];

		// Always show PARAMCD and PARAM, filter other columns by visibility state
		return displayData.columns.filter((column) => {
			return (
				['PARAMCD', 'PARAM'].includes(column) ||
				(visibleColumnState[column] !== undefined ? visibleColumnState[column] : true)
			);
		});
	}

	// Get filtered rows based on PARAMCD filter
	function getFilteredRows() {
		if (!displayData?.rows || !paramcdFilter.trim()) {
			return displayData?.rows || [];
		}

		const filter = paramcdFilter.trim().toLowerCase();

		return displayData.rows.filter((row) => {
			// For non-parameterized rows with PARAMCD='*', always show them
			if (row.isNonParameterized) {
				return true;
			}

			// Check if the PARAMCD contains the filter text
			const paramcd = String(row.PARAMCD || '').toLowerCase();
			return paramcd.includes(filter);
		});
	}

	// Derive filtered rows from the PARAMCD filter
	let filteredRows = $derived(getFilteredRows());

	// Effect to handle define changes and processing
	$effect(() => {
		cleanDatasetName = datasetName ? normalizeDatasetId(datasetName) : '';

		if (activeDefine && cleanDatasetName) {
			processor.process(activeDefine, cleanDatasetName);
		}
	});

	// Process VLM data into display format
	$effect(() => {
		const vlmData = processor.vlmData();
		const processingStatus = processor.status();

		if (processingStatus === 'error') {
			processingError = processor.error() || 'Unknown error occurred';
			displayData = { hasData: false };
			return;
		}

		if (!vlmData?.variables || vlmData.variables.size === 0) {
			displayData = { hasData: false };
			return;
		}

		try {
			const columns = new Set(['PARAMCD', 'PARAM']);
			const stratificationCols = new Set<string>();

			// First, collect all columns and identify stratification variables
			vlmData.variables.forEach((variable, variableName) => {
				if (!['PARAMCD', 'PARAM'].includes(variableName)) {
					columns.add(variableName);
				}

				// Look for stratification variables in the itemRefs
				variable.valueListDef.ItemRefs?.forEach((itemRef) => {
					if (itemRef.stratificationInfo) {
						Object.keys(itemRef.stratificationInfo).forEach((stratVar) => {
							stratificationCols.add(stratVar);
						});
					}
				});
			});

			// Add stratification columns to the display columns
			stratificationCols.forEach((column) => {
				columns.add(column);
			});

			// Update stratification columns state
			stratificationColumns = stratificationCols;

			// Create a map to track unique row identifiers
			const uniqueRowMap = new Map();

			// Process all variables to create rows
			vlmData.variables.forEach((variable, variableName) => {
				if (!variable.valueListDef.ItemRefs) return;

				variable.valueListDef.ItemRefs.forEach((itemRef) => {
					// Skip entries without proper paramcd value
					if (!itemRef.paramcd) {
						console.log('Skipping entry without paramcd value');
						return;
					}

					// Ensure paramcd is a string
					const paramcdStr =
						typeof itemRef.paramcd === 'string' ? itemRef.paramcd : String(itemRef.paramcd);

					// Skip invalid or placeholder paramcd values
					if (paramcdStr === 'undefined' || paramcdStr === 'null' || paramcdStr === '') {
						console.log('Skipping entry with invalid paramcd:', paramcdStr);
						return;
					}

					// Generate a unique identifier for this row based on PARAMCD and stratification
					let rowKey = paramcdStr;

					// Add stratification variables to the key if they exist
					if (itemRef.stratificationInfo) {
						Object.entries(itemRef.stratificationInfo).forEach(
							([variable, { comparator, values }]) => {
								if (values && values.length > 0) {
									rowKey += `|${variable}:${comparator}:${values.join(',')}`;
								}
							}
						);
					}

					// Get or create the row
					let row = uniqueRowMap.get(rowKey);
					if (!row) {
						// Ensure paramInfo.decode is a string
						const paramDecode = itemRef.paramInfo?.decode
							? typeof itemRef.paramInfo.decode === 'string'
								? itemRef.paramInfo.decode
								: String(itemRef.paramInfo.decode)
							: paramcdStr;

						// Create a new row with proper string values
						row = {
							PARAMCD: paramcdStr,
							PARAM: paramDecode,
							methodDescriptions: new Map()
						};

						// Add stratification values as separate columns
						if (itemRef.stratificationInfo) {
							Object.entries(itemRef.stratificationInfo).forEach(([variable, info]) => {
								const valueStr = Array.isArray(info.values)
									? info.values.join(', ')
									: String(info.values || '');
								row[variable] = `${formatComparator(info.comparator)} ${valueStr}`;
							});
						}

						uniqueRowMap.set(rowKey, row);
					}

					// Add variable data without overriding PARAMCD or PARAM
					if (variableName !== 'PARAMCD' && variableName !== 'PARAM') {
						row[variableName] = itemRef;
					}

					// Store method description
					if (itemRef.method?.Description) {
						row.methodDescriptions.set(variableName, itemRef.method.Description);
					}
				});
			});

			// Convert unique rows to array
			const parameterRows = Array.from(uniqueRowMap.values());

			// Sort rows by PARAMCD
			const sortedRows = parameterRows.sort((a, b) => {
				const paramcdA = String(a.PARAMCD || '');
				const paramcdB = String(b.PARAMCD || '');
				return paramcdA.localeCompare(paramcdB);
			});

			displayData = {
				hasData: true,
				columns: Array.from(columns),
				rows: sortedRows
			};

			processingError = null;
		} catch (error) {
			console.error('VLM View - Error:', error);
			processingError = error instanceof Error ? error.message : String(error);
			displayData = { hasData: false };
		}
	});

	// Initialize column visibility when displayData changes
	$effect(() => {
		if (displayData?.hasData && displayData?.columns) {
			// Only initialize columns that don't already have a visibility state
			displayData.columns.forEach((column) => {
				if (visibleColumnState[column] === undefined) {
					// This approach avoids infinite loops by only setting values once
					const newState = { ...visibleColumnState };
					newState[column] = true;
					visibleColumnState = newState;
				}
			});
		}
	});

	// Initialize column widths after data is processed
	$effect(() => {
		if (displayData.hasData && displayData.columns && cleanDatasetName) {
			// Initialize the VLM store with the dataset and columns
			vlmStore.initialize(cleanDatasetName, displayData.columns);
		}
	});

	// Force show all columns function
	function forceShowAllColumns() {
		if (!displayData?.columns) return;

		// Create new state object
		const newState: Record<string, boolean> = {};

		// Set ALL columns to true
		displayData.columns.forEach((col) => {
			newState[col] = true;
		});

		// Direct assignment
		visibleColumnState = newState;
	}

	// Helper function to format comparators
	function formatComparator(comparator: string): string {
		switch (comparator) {
			case 'EQ':
				return '=';
			case 'NE':
				return '≠';
			case 'LT':
				return '<';
			case 'LE':
				return '≤';
			case 'GT':
				return '>';
			case 'GE':
				return '≥';
			case 'IN':
				return 'in';
			case 'NOTIN':
				return 'not in';
			default:
				return comparator;
		}
	}
</script>

<!-- Debug info -->
<div class="mb-2 rounded-md bg-muted/10 p-2 text-sm">
	Active Define: {!!activeDefine ? 'Yes' : 'No'}, Dataset: {cleanDatasetName}
</div>

<!-- Main content -->
<div class="w-full space-y-6">
	{#if processingError}
		<Alert variant="destructive">
			<AlertDescription>
				Error processing value level metadata: {processingError}
			</AlertDescription>
		</Alert>
	{:else if displayData.hasData && displayData.columns && displayData.rows}
		<VLMFilterControls
			{paramcdFilter}
			columns={displayData.columns}
			{visibleColumnState}
			onFilterChange={(value) => (paramcdFilter = value)}
			onToggleColumn={(column) => {
				const newState = { ...visibleColumnState };
				newState[column] = !newState[column];
				visibleColumnState = newState;
			}}
			onShowAllColumns={forceShowAllColumns}
		/>

		<VLMTable
			{displayData}
			{filteredRows}
			visibleColumns={getVisibleColumns()}
			{cleanDatasetName}
			{stratificationColumns}
		/>
	{:else}
		<div class="rounded-lg border bg-muted/10 p-6 text-center text-muted-foreground">
			<div class="mb-2 text-xl">No value level metadata</div>
			<div class="text-sm">No value level metadata available for this dataset</div>
		</div>
	{/if}
</div>