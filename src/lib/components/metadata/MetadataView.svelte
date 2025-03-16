<script lang="ts">
	import type { ParsedDefineXML, ItemRef, ItemDef, ValueListDef } from '$lib/types/define-xml';
	import { normalizeDatasetId } from '$lib/core/utils/datasetUtils';
	import { Search, Table as TableIcon, LayoutList } from 'lucide-svelte';
	import { Input } from '$lib/components/core/input';
	import { Button } from '$lib/components/core/button';
	import MetadataTable from './table/MetadataTable.svelte';
	import MetadataCard from './card/MetadataCard.svelte';
	import { metadataViewStore } from '$lib/core/stores/MetadataViewStore.svelte';
	import { uiStore } from '$lib/core/stores/UIStore.svelte';
	import { ChevronDown, ChevronRight } from 'lucide-svelte';
	import {
		getAllExpansionKeys,
		isMethodExpanded,
		isCodelistExpanded
	} from './shared/expansionUtils';
	import { hasCodelist } from './shared/codelistUtils';

	let { define, defineType, datasetName } = $props<{
		define: ParsedDefineXML | null;
		defineType: 'SDTM' | 'ADaM' | null;
		datasetName: string;
	}>();

	let methods = $derived(define?.Methods || []);
	let comments = $derived(define?.Comments || []);
	let codeLists = $derived(define?.CodeLists || []);
	let rawState = $derived(metadataViewStore.getDatasetState(datasetName));
	let isTableView = $derived(uiStore.uiState.metadataViewMode === 'table');

	let datasetMetadata = $derived(() => {
		if (!define) return null;

		const normalizedName = normalizeDatasetId(datasetName);
		return define.ItemGroups?.find(
			(g: { Name: string }) => normalizeDatasetId(g.Name) === normalizedName
		);
	});

	function isItemRef(obj: any): obj is ItemRef {
		return obj && 'OID' in obj && 'Mandatory' in obj && 'OrderNumber' in obj;
	}

	function getBaseVariables() {
		if (!define || !datasetMetadata()) return [];

		const normalizedDatasetName = normalizeDatasetId(datasetName);

		const datasetRefs = define.ItemRefs.filter((ref: ItemRef) => {
			let refDataset;
			if (defineType === 'SDTM') {
				refDataset = ref.OID?.split('.')[0] || '';
			} else if (defineType === 'ADaM') {
				refDataset = ref.OID?.split('.')[1] || '';
			}
			return normalizeDatasetId(refDataset) === normalizedDatasetName;
		});

		const itemDefsMap = new Map(define.ItemDefs.map((def: ItemDef) => [def.OID, def]));
		const vlmVars = new Set(
			define.ValueListDefs.map(
				(vld: ValueListDef) => vld.OID?.split(`VL.${datasetName}.`)[1]
			).filter(Boolean)
		);

		return datasetRefs
			.map((ref: ItemRef) => {
				const varName = ref.OID?.split('.')[2] || '';
				return {
					...ref,
					itemDef: itemDefsMap.get(ref.OID),
					hasVLM: vlmVars.has(varName)
				};
			})
			.sort((a: { OrderNumber?: string }, b: { OrderNumber?: string }) => {
				return parseInt(a.OrderNumber || '0') - parseInt(b.OrderNumber || '0');
			});
	}

	function getFilteredVariables() {
		const baseVars = getBaseVariables();
		if (!baseVars?.length) return [];

		const searchLower = rawState.searchTerm.toLowerCase();
		if (!searchLower) return baseVars;

		return baseVars.filter((variable: any) => {
			const name = variable.itemDef?.Name?.toLowerCase() || '';
			const description = variable.itemDef?.Description?.toLowerCase() || '';
			return name.includes(searchLower) || description.includes(searchLower);
		});
	}

	function areAllExpanded() {
		const filteredVars = getFilteredVariables();
		if (filteredVars.length === 0) return false;

		return filteredVars.every((variable: { MethodOID?: string }) => {
			// Use the isItemRef type guard to check if variable is an ItemRef
			if (!isItemRef(variable)) {
				console.warn('Variable is not a valid ItemRef:', variable);
				return false; // If it's not a valid ItemRef, return false
			}

			const needsMethodExpansion = variable.MethodOID
				? isMethodExpanded(variable, datasetName)
				: true;

			const needsCodelistExpansion = hasCodelist(variable, codeLists)
				? isCodelistExpanded(variable, datasetName)
				: true;

			return needsMethodExpansion && needsCodelistExpansion;
		});
	}

	function toggleAll() {
		const filteredVars = getFilteredVariables();

		if (areAllExpanded()) {
			metadataViewStore.collapseAll(datasetName);
		} else {
			const expansionKeys = getAllExpansionKeys(filteredVars, datasetName, codeLists);
			metadataViewStore.expandAll(datasetName, expansionKeys);
		}
	}

	function toggleView() {
		uiStore.setMetadataViewMode(isTableView ? 'card' : 'table');
	}

	function updateSearch(term: string) {
		metadataViewStore.updateSearch(datasetName, term);
	}
</script>

<!-- Content section -->
<div class="flex h-[calc(100vh-12rem)] flex-col">
	<!-- Controls section -->
	<div class="flex-none p-4">
		<div class="flex items-center justify-between">
			<div class="relative w-64">
				<Search class="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
				<Input
					type="text"
					placeholder="Search variables..."
					class="pl-8"
					value={rawState.searchTerm}
					oninput={(e: Event) => {
						const target = e.target as HTMLInputElement;
						updateSearch(target.value);
					}}
				/>
			</div>

			<!-- Add expand/collapse all button -->
			<div class="flex items-center gap-4">
				<Button variant="outline" size="sm" class="gap-2" onclick={toggleAll}>
					{#if areAllExpanded()}
						<ChevronDown class="h-4 w-4" />
						<span>Collapse All</span>
					{:else}
						<ChevronRight class="h-4 w-4" />
						<span>Expand All</span>
					{/if}
				</Button>
			</div>

			<div class="flex gap-2">
				<Button variant="default" size="icon" onclick={toggleView} aria-label="Toggle view">
					{#if isTableView}
						<LayoutList class="h-4 w-4" />
					{:else}
						<TableIcon class="h-4 w-4" />
					{/if}
				</Button>
			</div>
		</div>
	</div>

	{#if define}
		{#if isTableView}
			<MetadataTable
				{define}
				{datasetName}
				filteredVariables={getFilteredVariables()}
				{methods}
				{comments}
				{codeLists}
			/>
		{:else}
			<MetadataCard
				{define}
				{datasetName}
				filteredVariables={getFilteredVariables()}
				{methods}
				{comments}
				{codeLists}
			/>
		{/if}
	{:else}
		<div class="flex h-[200px] items-center justify-center text-muted-foreground">
			<p>No metadata available for this dataset</p>
		</div>
	{/if}
</div>
