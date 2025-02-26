<script lang="ts">
	import DragHandle from '$lib/components/data/DataTable/DragHandle.svelte';
	import ResizeHandle from '$lib/components/data/DataTable/ResizeHandle.svelte';
	import { formatCellContent } from './cellFormatting';
	import ExpandableCell from './ExpandableCell.svelte';
	import { Alert, AlertDescription } from '$lib/components/core/alert';
	import type { ParsedDefineXML } from '$lib/types/define-xml';
	import { normalizeDatasetId } from '$lib/core/utils/datasetUtils';
	import { createVLMProcessor } from './VLMProcessor.svelte';
	import { vlmStore } from '$lib/core/stores/VLMStore.svelte';

	let { sdtmDefine, adamDefine, datasetName } = $props<{
		sdtmDefine: ParsedDefineXML | null;
		adamDefine: ParsedDefineXML | null;
		datasetName: string;
	}>();

	console.log('Inside VLMdataView', { sdtmDefine, adamDefine, datasetName });

	const processor = createVLMProcessor();
	let processingError = $state<string | null>(null);

	let activeDefine = $state<ParsedDefineXML | null>(null);
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

	// Section collapsed state tracking
	let collapsedSections = $state<Record<string, boolean>>({});

	// Effect to handle define changes and processing
	$effect(() => {
		activeDefine = sdtmDefine || adamDefine;
		cleanDatasetName = datasetName ? normalizeDatasetId(datasetName) : '';

		if (activeDefine && cleanDatasetName) {
			processor.process(activeDefine, cleanDatasetName);
		}
	});

	// Process VLM data into display format
	$effect(() => {
		const vlmData = processor.vlmData();
		const processingStatus = processor.status();

		console.log('Processing VLM Data:', {
			status: processingStatus,
			data: vlmData
		});

		if (processingStatus === 'error') {
			processingError = processor.error() || 'Unknown error occurred';
			displayData = { hasData: false };
			return;
		}

		if (!vlmData?.variables || vlmData.variables.size === 0) {
			console.log('No VLM data available');
			displayData = { hasData: false };
			return;
		}

		try {
			const columns = new Set(['PARAMCD', 'PARAM']);
			const rows = new Map<string, any>();

			// Create a single special row for non-parameterized variables
			const nonParameterizedRowId = 'NON_PARAMETERIZED_SPECIAL_ROW';
			rows.set(nonParameterizedRowId, {
				PARAMCD: '*',
				PARAM: 'Non-Parameter Specific Variables',
				isNonParameterized: true,
				methodDescriptions: new Map<string, string>() // Store method descriptions by variable
			});

			let hasNonParameterizedData = false;

			console.log('Starting data transformation', {
				variableCount: vlmData.variables.size,
				variables: Array.from(vlmData.variables.keys())
			});

			// First pass: Add all variables to columns
			vlmData.variables.forEach((variable, variableName) => {
				if (!['PARAMCD', 'PARAM'].includes(variableName)) {
					columns.add(variableName);
				}
			});

			// Second pass: Collect method descriptions for PARAMCD codes
			vlmData.variables.forEach((variable, variableName) => {
				if (variableName === 'PARAMCD' && variable.valueListDef.ItemRefs) {
					variable.valueListDef.ItemRefs.forEach((itemRef) => {
						if (itemRef.method?.Description && itemRef.paramcd) {
							const paramcd = itemRef.paramcd;
							if (!rows.has(paramcd)) {
								rows.set(paramcd, {
									PARAMCD: paramcd,
									PARAM: itemRef.paramInfo?.decode || '',
									isNonParameterized: false,
									methodDescriptions: new Map<string, string>(),
									// Store method description for PARAMCD itself
									paramcdMethodDescription: itemRef.method.Description
								});
							} else if (itemRef.method.Description) {
								rows.get(paramcd).paramcdMethodDescription = itemRef.method.Description;
							}
						}
					});
				}
			});

			// Third pass: Process all items and create rows
			vlmData.variables.forEach((variable, variableName) => {
				console.log('Processing variable:', {
					name: variableName,
					valueListDef: variable.valueListDef,
					hasItemRefs: !!variable.valueListDef.ItemRefs,
					itemRefsLength: variable.valueListDef.ItemRefs?.length || 0
				});

				// Skip if no ItemRefs or if processing PARAMCD/PARAM
				if (!variable.valueListDef.ItemRefs || ['PARAMCD', 'PARAM'].includes(variableName)) {
					return;
				}

				console.log(`Processing ItemRefs for ${variableName}`, {
					count: variable.valueListDef.ItemRefs.length
				});

				// Process each ItemRef
				variable.valueListDef.ItemRefs.forEach((itemRef) => {
					try {
						// Handle non-parameterized items
						if (itemRef.isNonParameterized) {
							console.log(`Adding non-parameterized ${variableName} to consolidated row`);
							rows.get(nonParameterizedRowId)[variableName] = itemRef;

							// Store method description for this variable
							if (itemRef.method?.Description) {
								rows
									.get(nonParameterizedRowId)
									.methodDescriptions.set(variableName, itemRef.method.Description);
							}

							hasNonParameterizedData = true;
							return;
						}

						// Handle regular parameterized items
						const paramcd = itemRef.paramcd;
						if (!paramcd) {
							console.warn(`Skipping item with missing PARAMCD for ${variableName}`);
							return;
						}

						// Create row if it doesn't exist
						if (!rows.has(paramcd)) {
							rows.set(paramcd, {
								PARAMCD: paramcd,
								PARAM: itemRef.paramInfo?.decode || '',
								isNonParameterized: false,
								methodDescriptions: new Map<string, string>()
							});
						}

						// Add this variable to the row
						const row = rows.get(paramcd);
						row[variableName] = itemRef;

						// Store method description for this variable
						if (itemRef.method?.Description) {
							row.methodDescriptions.set(variableName, itemRef.method.Description);
						}
					} catch (err) {
						console.error(`Error processing ItemRef for ${variableName}:`, err);
					}
				});
			});

			// Remove the non-parameterized row if there's no data
			if (!hasNonParameterizedData) {
				console.log('No non-parameterized data found, removing special row');
				rows.delete(nonParameterizedRowId);
			}

			// Safely convert to array and sort
			const rowsArray = Array.from(rows.values());
			console.log('Rows before sorting:', rowsArray);

			// Sort the rows with safe string comparison
			const sortedRows = rowsArray.sort((a, b) => {
				// Non-parameterized row first
				if (a.isNonParameterized === true && b.isNonParameterized !== true) return -1;
				if (a.isNonParameterized !== true && b.isNonParameterized === true) return 1;

				// For regular rows, sort by PARAMCD
				const paramcdA = String(a.PARAMCD || '');
				const paramcdB = String(b.PARAMCD || '');
				return paramcdA.localeCompare(paramcdB);
			});

			console.log('Final transformed data:', {
				columnCount: columns.size,
				columns: Array.from(columns),
				rowCount: sortedRows.length,
				sampleRow: sortedRows.length > 0 ? sortedRows[0] : null,
				hasNonParameterizedRow: hasNonParameterizedData
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

	// Initialize column widths after data is processed
	$effect(() => {
		if (displayData.hasData && displayData.columns && cleanDatasetName) {
			console.log('Initializing column widths after data processing');

			// Initialize the VLM store with the dataset and columns
			vlmStore.initialize(cleanDatasetName, displayData.columns);

			// Load initial widths from store to local state
			const initialWidths = {};
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
		dragOverColumn = column;
	}

	function handleDrop(e: DragEvent, column: string) {
		e.preventDefault();
		if (draggedColumn && displayData.columns) {
			const draggedIndex = displayData.columns.indexOf(draggedColumn);
			const dropIndex = displayData.columns.indexOf(column);

			if (draggedIndex !== -1 && dropIndex !== -1) {
				const newColumns = [...displayData.columns];
				newColumns.splice(draggedIndex, 1);
				newColumns.splice(dropIndex, 0, draggedColumn);

				displayData = {
					...displayData,
					columns: newColumns
				};
			}
		}

		draggedColumn = null;
		dragOverColumn = null;
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
		<div class="rounded-lg border bg-card shadow-sm">
			<div class="h-[calc(100vh-14rem)] w-full">
				<div class="h-full overflow-auto">
					<table class="w-full border-collapse">
						<thead class="sticky top-0 z-10">
							<tr>
								{#each displayData.columns as column}
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
							{#each displayData.rows as row, i}
								<tr class="{i % 2 === 0 ? 'bg-white' : 'bg-muted/10'} hover:bg-primary/5">
									{#each displayData.columns as column}
										<td
											class="overflow-hidden border p-2 align-top"
											style="width: {getColumnWidth(cleanDatasetName, column)}px"
											data-column={column}
										>
											{#if column === 'PARAMCD'}
												<div>
													<!-- Clean PARAMCD display -->
													<div class="font-mono font-bold">{row[column]}</div>

													<!-- Display method description if available -->
													{#if row.paramcdMethodDescription}
														<div class="mt-1 text-xs italic text-muted-foreground">
															{row.paramcdMethodDescription}
														</div>
													{/if}
												</div>
											{:else if column === 'PARAM'}
												<div class="font-medium">{row[column]}</div>
											{:else if row[column]}
												<!-- Process cell content by type -->
												{#if row[column].itemDescription}
													<div class="mb-2">
														<div class="mb-1 text-sm">
															{column} Definition
														</div>
														<div>
															{row[column].itemDescription}
														</div>
													</div>
												{/if}

												<!-- Where Clause -->
												{#if row[column].whereClause}
													{#if row[column].whereClause.source?.variable}
														{@const sectionId = getSectionId(row.PARAMCD, column, 'where')}
														<div class="mb-2">
															<button
																type="button"
																class="mb-1 flex w-fit cursor-pointer items-center gap-1 rounded-sm bg-muted/30 px-2 py-1 text-primary-foreground"
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

												<!-- Method -->
												{#if row[column].method}
													{@const sectionId = getSectionId(row.PARAMCD, column, 'method')}
													<div class="mb-2">
														<button
															type="button"
															class="mb-1 flex w-fit cursor-pointer items-center gap-1 rounded-sm bg-muted/30 px-2 py-1 text-primary-foreground"
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

												<!-- Codelist -->
												{#if row[column].codelist}
													{@const sectionId = getSectionId(row.PARAMCD, column, 'codelist')}
													<div class="mb-2">
														<button
															type="button"
															class="mb-1 flex w-fit cursor-pointer items-center gap-1 rounded-sm bg-muted/30 px-2 py-1 text-primary-foreground"
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
															<span class="text-xs font-medium">Codelist</span>
														</button>
														<div class={collapsedSections[sectionId] ? 'hidden' : 'pl-2'}>
															{#if row[column].codelist.name}
																<div class="mb-1">
																	<span class="mr-1 text-xs font-medium text-muted-foreground"
																		>Name:</span
																	>
																	{row[column].codelist.name}
																</div>
															{/if}
														</div>
													</div>
												{/if}

												<!-- Debug Info -->
												{@const sectionId = getSectionId(row.PARAMCD, column, 'debug')}
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
													<div class={collapsedSections[sectionId] ? 'hidden' : 'mt-1 pl-2'}>
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
