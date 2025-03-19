<script lang="ts">
	import { vlmStore } from '$lib/core/stores/VLMStore.svelte';
	import VLMParameterCell from './cells/VLMParameterCell.svelte';
	import VLMMethodSection from './cells/VLMMethodSection.svelte';
	import VLMWhereClauseSection from './cells/VLMWhereClauseSection.svelte';
	import VLMCommentSection from './cells/VLMCommentSection.svelte';
	import VLMCodelistSection from './cells/VLMCodelistSection.svelte';
	import VLMOriginSection from './cells/VLMOriginSection.svelte';
	import VLMDebugSection from './cells/VLMDebugSection.svelte';
	import VLMStratificationCell from './cells/VLMStratificationCell.svelte';

	let {
		row,
		visibleColumns,
		cleanDatasetName,
		stratificationColumns,
		rowIndex
	} = $props<{
		row: any;
		visibleColumns: string[];
		cleanDatasetName: string;
		stratificationColumns: Set<string>;
		rowIndex: number;
	}>();

	// Get column width from the store
	function getColumnWidth(datasetName: string, column: string): number {
		if (!column || !datasetName) return 150;

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

	// Generate a unique ID for sections
	function getSectionId(paramcd: string, column: string, sectionType: string): string {
		return `${paramcd}_${column}_${sectionType}`;
	}

	// Get PARAMCD value safely
	function getParamcd(): string {
		return typeof row.PARAMCD === 'object' 
			? row.PARAMCD.paramcd || '' 
			: String(row.PARAMCD || '');
	}
</script>

<tr class="{rowIndex % 2 === 0 ? 'bg-white' : 'bg-muted/10'} hover:bg-primary/5">
	{#each visibleColumns as column}
		<td
			class="overflow-hidden border p-2 align-top"
			style="width: {getColumnWidth(cleanDatasetName, column)}px"
			data-column={column}
		>
			{#if column === 'PARAMCD' || column === 'PARAM'}
				<VLMParameterCell {row} {column} />
			{:else if stratificationColumns.has(column) && row[column]}
				<VLMStratificationCell {row} {column} />
			{:else if row[column] && typeof row[column] === 'object' && (row[column].itemDescription || row[column].method || row[column].whereClause || row[column].codelist || row[column].origin)}
				<!-- Display regular cell content with sections only if it has structured data -->
				<div class="space-y-2">
					<!-- Item Description if available -->
					{#if typeof row[column] === 'object' && row[column].itemDescription}
						<div class="mb-2">
							<div>{row[column].itemDescription}</div>
						</div>
					{/if}

					<!-- Method Section -->
					{#if typeof row[column] === 'object' && row[column].method}
						<VLMMethodSection 
							method={row[column].method}
							sectionId={getSectionId(getParamcd(), column, 'method')}
						/>
					{/if}

					<!-- Where Clause Section -->
					{#if typeof row[column] === 'object' && row[column].whereClause?.source?.variable}
						<VLMWhereClauseSection 
							whereClause={row[column].whereClause}
							sectionId={getSectionId(getParamcd(), column, 'where')}
						/>
					{/if}

					<!-- Comment Section -->
					{#if typeof row[column] === 'object' && row[column].comment?.description}
						<VLMCommentSection 
							comment={row[column].comment}
							sectionId={getSectionId(getParamcd(), column, 'comment')}
						/>
					{/if}

					<!-- Codelist Section -->
					{#if typeof row[column] === 'object' && row[column].codelist}
						<VLMCodelistSection 
							codelist={row[column].codelist}
							sectionId={getSectionId(getParamcd(), column, 'codelist')}
						/>
					{/if}

					<!-- Origin Section -->
					{#if typeof row[column] === 'object' && row[column].origin}
						<VLMOriginSection 
							origin={row[column].origin}
							sectionId={getSectionId(getParamcd(), column, 'origin')}
						/>
					{/if}

					<!-- Debug Info -->
					{#if typeof row[column] === 'object'}
						<VLMDebugSection 
							data={row[column]}
							sectionId={getSectionId(getParamcd(), column, 'debug')}
						/>
					{/if}
				</div>
			{:else if row[column] && typeof row[column] === 'string'}
				<!-- Display simple string value -->
				<div>{row[column]}</div>
			{/if}
		</td>
	{/each}
</tr>