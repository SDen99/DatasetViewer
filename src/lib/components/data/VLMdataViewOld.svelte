<script lang="ts">
	import DragHandle from '$lib/components/data/DataTable/DragHandle.svelte';
	import ResizeHandle from '$lib/components/data/DataTable/ResizeHandle.svelte';
	import { formatCellContent } from './cellFormatting';
	import ExpandableCell from './ExpandableCell.svelte';
	import { Alert, AlertDescription } from '$lib/components/core/alert';
	import type { ParsedDefineXML } from '$lib/types/define-xml';
	import { normalizeDatasetId } from '$lib/core/utils/datasetUtils';
	import { createVLMProcessor } from '$lib/core/processors/defineXML/VLM/VLMProcessor.svelte';
	import { vlmStore } from '$lib/core/stores/VLMStore.svelte';

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

	let draggedColumn = $state<string | null>(null);
	let dragOverColumn = $state<string | null>(null);
	let columnWidths = $state<Record<string, number>>({});
	let columnWidthsCache = $state<Record<string, Record<string, number>>>({});
	let tableRef = $state<HTMLElement | null>(null);
	let isTableRendered = $state(false);

	// Column visibility state
	let visibleColumnState = $state<Record<string, boolean>>({});

	// Section collapsed state tracking
	let collapsedSections = $state<Record<string, boolean>>({});

	// PARAMCD filter
	let paramcdFilter = $state('');

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
			const stratificationColumns = new Set<string>();

			// First, collect all columns and identify stratification variables
			vlmData.variables.forEach((variable, variableName) => {
				if (!['PARAMCD', 'PARAM'].includes(variableName)) {
					columns.add(variableName);
				}

				// Look for stratification variables in the itemRefs
				variable.valueListDef.ItemRefs?.forEach((itemRef) => {
					if (itemRef.stratificationInfo) {
						Object.keys(itemRef.stratificationInfo).forEach((stratVar) => {
							stratificationColumns.add(stratVar);
						});
					}
				});
			});

			// Add stratification columns to the display columns
			stratificationColumns.forEach((column) => {
				columns.add(column);
			});

			console.log('Identified stratification columns:', Array.from(stratificationColumns));

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

					// IMPORTANT CHANGE: Add variable data without overriding PARAMCD or PARAM
					// When adding non-PARAMCD and non-PARAM variables, we want to keep the complex object
					// but we've already set PARAMCD and PARAM as strings in the row
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

			console.log(`Created ${sortedRows.length} rows with stratification columns`);

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
			console.log('Initializing column widths after data processing');

			// Initialize the VLM store with the dataset and columns
			vlmStore.initialize(cleanDatasetName, displayData.columns);

			// Load initial widths from store to local state
			const initialWidths: Record<string, number> = {};
			displayData.columns.forEach((column) => {
				const storeWidth = vlmStore.getColumnWidths(cleanDatasetName)[column];
				if (storeWidth) {
					initialWidths[column] = storeWidth;
				}
			});

			// Only update if we have widths
			if (Object.keys(initialWidths).length > 0) {
				columnWidths = initialWidths;
			}

			// Force an update of column widths in the DOM
			requestAnimationFrame(() => {
				displayData.columns?.forEach((column) => {
					const width = getColumnWidth(cleanDatasetName, column);
					if (width > 0) {
						forceUpdateColumnWidth(column, width);
					}
				});
			});
		}
	});

	function handleDragStart(e: DragEvent, column: string) {
		draggedColumn = column;
	}

	function handleDragOver(e: DragEvent, column: string) {
		e.preventDefault();
		if (getVisibleColumns().includes(column)) {
			dragOverColumn = column;
		}
	}

	function handleDrop(e: DragEvent, column: string) {
		e.preventDefault();
		if (draggedColumn && displayData.columns) {
			const visibleCols = getVisibleColumns();
			const draggedIndex = visibleCols.indexOf(draggedColumn);
			const dropIndex = visibleCols.indexOf(column);

			if (draggedIndex !== -1 && dropIndex !== -1) {
				// Get the full columns array
				const newColumns = [...displayData.columns];

				// Remove draggedColumn from its current position
				const draggedItem = newColumns.splice(newColumns.indexOf(draggedColumn), 1)[0];

				// Insert at new position relative to the drop target
				const targetIndex = newColumns.indexOf(column);
				newColumns.splice(targetIndex, 0, draggedItem);

				displayData = {
					...displayData,
					columns: newColumns
				};
			}
		}

		draggedColumn = null;
		dragOverColumn = null;
	}

	// Toggle column visibility
	function toggleColumnVisibility(column: string) {
		const newState = { ...visibleColumnState };
		newState[column] = !newState[column];
		visibleColumnState = newState;
	}

	// Create a direct, specialized function just for this action
	// This helps bypass any potential issues with circular reactivity
	function forceShowAllColumns() {
		if (!displayData?.columns) return;

		// Create new state object
		const newState: Record<string, boolean> = {};

		// Set ALL columns to true
		displayData.columns.forEach((col) => {
			newState[col] = true;
		});

		// Force console output for debugging
		console.log('FORCE SHOW ALL COLUMNS', newState);

		// Direct assignment
		visibleColumnState = newState;

		// Force a UI redraw with setTimeout
		setTimeout(() => {
			console.log('Checking column visibility state after update', visibleColumnState);
		}, 100);
	}

	// Handle PARAMCD filter change
	function handleParamcdFilterChange(e: Event) {
		const target = e.target as HTMLInputElement; // Cast target to HTMLInputElement
		paramcdFilter = target.value;
	}

	// Updated handleResize function
	function handleResize(column: string, width: number) {
		if (!width || width < 50) return;

		try {
			console.log(`Resizing column ${column} to ${width}px`);

			// First update the store
			vlmStore.updateColumnWidth(cleanDatasetName, column, width);

			// Then update local state to match
			columnWidths = {
				...columnWidths,
				[column]: width
			};

			// Force an immediate DOM update
			forceUpdateColumnWidth(column, width);
		} catch (error) {
			console.error('Error updating column width:', error);
		}
	}

	function applyAllColumnWidths() {
		if (!displayData.columns || !cleanDatasetName) return;

		console.log('Applying all column widths to DOM');

		displayData.columns.forEach((column) => {
			const width = getColumnWidth(cleanDatasetName, column);
			const selector = `[data-column="${column}"]`;
			const elements = document.querySelectorAll(selector);

			console.log(`Setting width for ${column} to ${width}px (${elements.length} elements)`);

			elements.forEach((el) => {
				if (el instanceof HTMLElement) {
					// Set both width and min-width to ensure it takes effect
					el.style.width = `${width}px`;
					el.style.minWidth = `${width}px`;
					el.style.maxWidth = `${width}px`;
				}
			});
		});
	}
	// More robust force update function
	function forceUpdateColumnWidth(column: string, width: number) {
		if (!column || !width) return;

		console.log(`Forcing update of width for ${column} to ${width}px`);

		const selector = `[data-column="${column}"]`;
		const elements = document.querySelectorAll(selector);

		console.log(`Found ${elements.length} elements with selector ${selector}`);

		elements.forEach((el) => {
			if (el instanceof HTMLElement) {
				// Set both width and min-width to ensure it takes effect
				el.style.width = `${width}px`;
				el.style.minWidth = `${width}px`;
				el.style.maxWidth = `${width}px`;
			}
		});
	}

	// Collapse/expand section
	function toggleSection(sectionId: string) {
		collapsedSections[sectionId] = !collapsedSections[sectionId];
	}

	// Generate a unique ID for each section
	function getSectionId(paramcd: string, column: string, sectionType: string): string {
		return `${paramcd}_${column}_${sectionType}`;
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

	// More defensive getColumnWidth function
	function getColumnWidth(datasetName: string, column: string): number {
		if (!column || !datasetName) return 150;

		// First check local component state
		const localWidth = columnWidths[column];
		if (typeof localWidth === 'number' && localWidth > 0) {
			return localWidth;
		}

		// Then check the store if available
		try {
			const storeWidths = vlmStore.getColumnWidths(datasetName);
			if (storeWidths && typeof storeWidths[column] === 'number' && storeWidths[column] > 0) {
				return storeWidths[column];
			}
		} catch (e) {
			console.warn(`Error getting width from store for ${column}:`, e);
		}

		// Default width
		return 150;
	}

	$effect(() => {
		if (tableRef && displayData.hasData && !isTableRendered) {
			console.log('Table reference available, setting up resize observer');
			isTableRendered = true;

			// Set up a resize observer to detect when table dimensions change
			const resizeObserver = new ResizeObserver((entries) => {
				console.log('Table resize observed');
				applyAllColumnWidths();
			});

			resizeObserver.observe(tableRef);

			// Also apply widths immediately
			setTimeout(applyAllColumnWidths, 100);
		}
	});
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
		<!-- PARAMCD Filter -->
		<div class="mb-4">
			<div class="flex items-center gap-2">
				<label for="paramcd-filter" class="font-medium">Filter PARAMCD:</label>
				<input
					id="paramcd-filter"
					type="text"
					class="flex h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
					placeholder="Enter PARAMCD..."
					value={paramcdFilter}
					oninput={handleParamcdFilterChange}
				/>
				{#if paramcdFilter.trim()}
					<button
						type="button"
						class="text-sm text-muted-foreground hover:text-primary-foreground"
						onclick={() => (paramcdFilter = '')}
					>
						Clear
					</button>
				{/if}
			</div>
		</div>

		<!-- Column Visibility Controls -->
		<div class="mb-4">
			<div class="flex items-center">
				<h3 class="mr-3 font-medium">Columns</h3>
				<button
					type="button"
					id="force-show-all-btn"
					class="mr-4 rounded-md bg-primary px-3 py-1 text-sm text-primary-foreground hover:bg-primary/90"
					onclick={forceShowAllColumns}
				>
					Show All Columns
				</button>

				<div class="flex-grow"></div>
			</div>

			<div class="mt-2 flex flex-wrap gap-2">
				{#each displayData.columns.filter((col) => !['PARAMCD', 'PARAM'].includes(col)) || [] as column}
					<label
						class="flex items-center gap-1.5 rounded-md border bg-card px-2 py-1 text-sm shadow-sm"
					>
						<input
							type="checkbox"
							checked={visibleColumnState[column] !== false}
							onclick={() => toggleColumnVisibility(column)}
						/>
						{column}
					</label>
				{/each}
			</div>
		</div>

		<div class="rounded-lg border bg-card shadow-sm">
			<div class="w-full">
				<div class="h-[calc(100vh-24rem)] overflow-auto">
					<table class="w-full border-collapse" bind:this={tableRef}>
						<thead class="sticky top-0 z-10">
							<tr>
								{#each getVisibleColumns() as column}
									<th
										class="group/header relative whitespace-nowrap border bg-muted p-2 text-left font-semibold text-muted-foreground
					  {dragOverColumn === column ? 'border-l-2 border-primary' : ''}"
										style="width: {getColumnWidth(cleanDatasetName, column)}px"
										data-column={column}
										draggable={true}
										ondragstart={(e) => handleDragStart(e, column)}
										ondragover={(e) => handleDragOver(e, column)}
										ondrop={(e) => handleDrop(e, column)}
									>
										<div class="flex h-full select-none items-center gap-2">
											<DragHandle />
											<span class="flex-1">{column}</span>
											<ResizeHandle onResize={(width) => handleResize(column, width)} />
										</div>
									</th>
								{/each}
							</tr>
						</thead>
						<tbody>
							{#each filteredRows as row, i}
								<tr class="{i % 2 === 0 ? 'bg-white' : 'bg-muted/10'} hover:bg-primary/5">
									{#each getVisibleColumns() as column}
										<td
											class="overflow-hidden border p-2 align-top"
											style="width: {getColumnWidth(cleanDatasetName, column)}px"
											data-column={column}
										>
											{#if column === 'PARAMCD'}
												<div>
													<div class="font-mono font-bold">
														{typeof row[column] === 'object'
															? row[column]?.paramcd || row[column]?.paramInfo?.codedValue || ''
															: String(row[column] || '')}
													</div>
												</div> 
											{:else if column === 'PARAM'}
												<div class="font-medium">
													{typeof row[column] === 'object'
														? row[column]?.paramInfo?.decode || ''
														: String(row[column] || '')}
												</div>
											{:else if stratificationColumns.has(column) && row[column]}
												<!-- Display stratification column values -->
												<div class="text-sm">
													{typeof row[column] === 'object'
														? JSON.stringify(row[column])
														: String(row[column] || '')}
												</div>
											{:else if row[column]}
												<!-- Process cell content by type -->
												{#if typeof row[column] === 'object' && row[column].itemDescription}
													<div class="mb-2">
														<div>
															{row[column].itemDescription}
														</div>
													</div> 
												{/if}
												  
<!-- Method -->
{#if typeof row[column] === 'object' && row[column].method}
{@const sectionId = getSectionId(
	typeof row.PARAMCD === 'object' ? row.PARAMCD.paramcd : row.PARAMCD,
	column,
	'method'
)}
<div class="mb-2">
	<button
		type="button"
		class="mb-1 flex w-fit cursor-pointer items-center gap-1 rounded-sm bg-primary/20 px-2 py-1 text-foreground"
		onclick={() => toggleSection(sectionId)}
		onkeydown={(e) => e.key === 'Enter' && toggleSection(sectionId)}
		aria-expanded={!collapsedSections[sectionId]}
	>
		<svg
			class="h-3 w-3" 
			viewBox="0 0 24 24"
			fill="none"
			stroke="currentColor"
			stroke-width="2" 
		>
			<path
				d={collapsedSections[sectionId]
					? 'M9 5l7 7-7 7'
					: 'M19 9l-7 7-7-7'}
			></path>
		</svg>
		<span class="text-xs font-medium">Method</span>
	</button>
	<div class={collapsedSections[sectionId] ? 'hidden' : 'pl-2'}>
		{#if row[column].method.Type}
			<div class="mb-1">
				<span class="mr-1 text-xs font-medium text-muted-foreground"
					>Type:</span
				>
				{row[column].method.Type}
			</div>
		{/if}
		{#if row[column].method.Description}
			<div class="mb-1">
				<span class="mr-1 text-xs font-medium text-muted-foreground"
					>Description:</span
				>
				{row[column].method.Description}
			</div>
		{/if}
	</div>
</div>
{/if}

												<!-- Where Clause -->
												{#if typeof row[column] === 'object' && row[column].whereClause}
													{#if row[column].whereClause.source?.variable}
														{@const sectionId = getSectionId(
															typeof row.PARAMCD === 'object' ? row.PARAMCD.paramcd : row.PARAMCD,
															column,
															'where'
														)}
														<div class="mb-2">
															<button
																type="button"
																class="mb-1 flex w-fit cursor-pointer items-center gap-1 rounded-sm bg-primary/20 px-2 py-1 text-foreground"
																onclick={() => toggleSection(sectionId)}
																onkeydown={(e) => e.key === 'Enter' && toggleSection(sectionId)}
																aria-expanded={!collapsedSections[sectionId]}
															>
																<svg
																	class="h-3 w-3"
																	viewBox="0 0 24 24"
																	fill="none"
																	stroke="currentColor"
																	stroke-width="2"
																>
																	<path
																		d={collapsedSections[sectionId]
																			? 'M9 5l7 7-7 7'
																			: 'M19 9l-7 7-7-7'}
																	></path>
																</svg>
																<span class="text-xs font-medium">Where Clause</span>
															</button>
															<div class={collapsedSections[sectionId] ? 'hidden' : 'pl-2'}>
																<div class="mb-1">
																	<span class="mr-1 text-xs font-medium text-muted-foreground"
																		>Condition:</span
																	>
																	{row[column].whereClause.source.variable}
																	{formatComparator(row[column].whereClause.comparator)}
																	{row[column].whereClause.checkValues.join(', ')}
																</div>
															</div>
														</div>
													{/if}
												{/if}


												<!-- Comment -->
												{#if typeof row[column] === 'object' && row[column].comment && row[column].comment.description}
													{@const sectionId = getSectionId(
														typeof row.PARAMCD === 'object' ? row.PARAMCD.paramcd : row.PARAMCD,
														column,
														'comment'
													)}
													<div class="mb-2">
														<button
															type="button"
															class="mb-1 flex w-fit cursor-pointer items-center gap-1 rounded-sm bg-primary/20 px-2 py-1 text-foreground"
															onclick={() => toggleSection(sectionId)}
															onkeydown={(e) => e.key === 'Enter' && toggleSection(sectionId)}
															aria-expanded={!collapsedSections[sectionId]}
														>
															<svg
																class="h-3 w-3"
																viewBox="0 0 24 24"
																fill="none"
																stroke="currentColor"
																stroke-width="2"
															>
																<path
																	d={collapsedSections[sectionId]
																		? 'M9 5l7 7-7 7'
																		: 'M19 9l-7 7-7-7'}
																></path>
															</svg>
															<span class="text-xs font-medium">Comment</span>
														</button>
														<div class={collapsedSections[sectionId] ? 'hidden' : 'pl-2'}>
															<div class="text-sm leading-relaxed">
																{row[column].comment.description}
															</div>
														</div>
													</div>
												{/if}
												
												<!-- Enhanced CodeList section -->
												{#if typeof row[column] === 'object' && row[column].codelist}
													{@const sectionId = getSectionId(
														typeof row.PARAMCD === 'object' ? row.PARAMCD.paramcd : row.PARAMCD,
														column,
														'codelist'
													)}
													<div class="mb-2">
														<button
															type="button"
															class="mb-1 flex w-fit cursor-pointer items-center gap-1 rounded-sm bg-primary/20 px-2 py-1 text-foreground"
															onclick={() => toggleSection(sectionId)}
															onkeydown={(e) => e.key === 'Enter' && toggleSection(sectionId)}
															aria-expanded={!collapsedSections[sectionId]}
														>
															<svg
																class="h-3 w-3"
																viewBox="0 0 24 24"
																fill="none"
																stroke="currentColor"
																stroke-width="2"
															>
																<path
																	d={collapsedSections[sectionId]
																		? 'M9 5l7 7-7 7'
																		: 'M19 9l-7 7-7-7'}
																></path>
															</svg>
															<span class="text-xs font-medium">
																Codelist {row[column].codelist.items
																	? `(${row[column].codelist.items.length} values)`
																	: ''}
															</span>
														</button>
														<div class={collapsedSections[sectionId] ? 'hidden' : 'pl-2'}>
															{#if row[column].codelist.name}
																<div class="mb-2">
																	<span class="text-xs font-medium text-muted-foreground"
																		>Name:</span
																	>
																	<span class="ml-1">{row[column].codelist.name}</span>
																</div>
															{/if}

															{#if row[column].codelist.comment}
																<div class="mb-2 bg-muted/10 p-2 text-sm">
																	<span class="block text-xs font-medium text-muted-foreground"
																		>Comment:</span
																	>
																	<span class="text-sm">{row[column].codelist.comment.text}</span>
																</div>
															{/if}

															{#if row[column].codelist.items && row[column].codelist.items.length > 0}
																<div class="mt-2">
																	<span class="mb-1 block text-xs font-medium text-muted-foreground"
																		>Values:</span
																	>
																	<div class="max-h-60 overflow-y-auto rounded border">
																		<table class="w-full text-sm">
																			<thead class="bg-muted/20 text-xs">
																				<tr>
																					<th class="border-b px-2 py-1 text-left">Value</th>
																					<th class="border-b px-2 py-1 text-left">Decode</th>
																				</tr>
																			</thead>
																			<tbody>
																				{#each row[column].codelist.items as item, i}
																					<tr class={i % 2 === 0 ? 'bg-white' : 'bg-muted/5'}>
																						<td class="border-b px-2 py-1 font-mono">
																							{item.codedValue}
																						</td>
																						<td class="border-b px-2 py-1">
																							{item.decode}
																						</td>
																					</tr>
																				{/each}
																			</tbody>
																		</table>
																	</div>
																</div>
															{/if}
														</div>
													</div>
												{/if}
												<!-- Origin -->
												{#if typeof row[column] === 'object' && row[column].origin}
													{@const sectionId = getSectionId(
														typeof row.PARAMCD === 'object' ? row.PARAMCD.paramcd : row.PARAMCD,
														column,
														'origin'
													)}
													<div class="mb-2">
														<button
															type="button"
															class="mb-1 flex w-fit cursor-pointer items-center gap-1 rounded-sm bg-primary/20 px-2 py-1 text-foreground"
															onclick={() => toggleSection(sectionId)}
															onkeydown={(e) => e.key === 'Enter' && toggleSection(sectionId)}
															aria-expanded={!collapsedSections[sectionId]}
														>
															<svg
																class="h-3 w-3"
																viewBox="0 0 24 24"
																fill="none"
																stroke="currentColor"
																stroke-width="2"
															>
																<path
																	d={collapsedSections[sectionId]
																		? 'M9 5l7 7-7 7'
																		: 'M19 9l-7 7-7-7'}
																></path>
															</svg>
															<span class="text-xs font-medium">Origin</span>
														</button>
														<div class={collapsedSections[sectionId] ? 'hidden' : 'pl-2'}>
															{#if row[column].origin.type}
																<div class="mb-1">
																	<span class="mr-1 text-xs font-medium text-muted-foreground"
																		>Type:</span
																	>
																	{row[column].origin.type}
																</div>
															{/if}

															{#if row[column].origin.source}
																<div class="mb-1">
																	<span class="mr-1 text-xs font-medium text-muted-foreground"
																		>Source:</span
																	>
																	{row[column].origin.source}
																</div>
															{/if}

															{#if row[column].origin.description}
																<div class="mb-1">
																	<span class="mr-1 text-xs font-medium text-muted-foreground"
																		>Description:</span
																	>
																	{row[column].origin.description}
																</div>
															{/if}

															{#if row[column].origin.translatedText}
																<div class="mb-1">
																	<span class="mr-1 text-xs font-medium text-muted-foreground"
																		>TranslatedText:</span
																	>
																	{row[column].origin.translatedText}
																</div>
															{/if}
														</div>
													</div>
												{/if}

												<!-- Debug Info -->
												{@const sectionId = getSectionId(
													typeof row.PARAMCD === 'object' ? row.PARAMCD.paramcd : row.PARAMCD,
													column,
													'debug'
												)}
												<div class="mt-2 text-xs text-gray-500">
													<button
														type="button"
														class="cursor-pointer text-left underline"
														onclick={() => toggleSection(sectionId)}
														onkeydown={(e) => e.key === 'Enter' && toggleSection(sectionId)}
														aria-expanded={!collapsedSections[sectionId]}
													>
														Debug OIDs
													</button>
													<div
														class={collapsedSections[sectionId] === false ? 'mt-1 pl-2' : 'hidden'}
													>
														{#if row[column].OID}
															<div class="mb-1">ItemDef OID: {row[column].OID}</div>
														{/if}
														{#if row[column].valueListOID}
															<div class="mb-1">ValueList OID: {row[column].valueListOID}</div>
														{/if}
														{#if row[column].whereClause?.whereClauseOID}
															<div class="mb-1">
																WhereClause OID: {row[column].whereClause.whereClauseOID}
															</div>
														{/if}
														{#if row[column].methodOID}
															<div class="mb-1">Method OID: {row[column].methodOID}</div>
														{/if}
														<!-- Add this line for Comment OID -->
														{#if row[column].comment?.OID}
															<div class="mb-1">Comment OID: {row[column].comment.OID}</div>
														{/if}
													</div>
												</div>
											{/if}
										</td>
									{/each}
								</tr>
							{/each}
						</tbody>
					</table>
				</div>
			</div>
		</div>
	{:else}
		<div class="rounded-lg border bg-muted/10 p-6 text-center text-muted-foreground">
			<div class="mb-2 text-xl">No value level metadata</div>
			<div class="text-sm">No value level metadata available for this dataset</div>
		</div>
	{/if}
</div>
