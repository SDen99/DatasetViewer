<script lang="ts">
	import type { ParsedDefineXML } from '$lib/core/processors/defineXML/types';
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

	let { sdtmDefine, adamDefine, datasetName } = $props<{
		sdtmDefine: ParsedDefineXML | null;
		adamDefine: ParsedDefineXML | null;
		datasetName: string;
	}>();

	let define = $derived(sdtmDefine || adamDefine);
	let methods = $derived(define?.methods || []);
	let comments = $derived(define?.comments || []);
	let codeLists = $derived(define?.CodeLists || []);
	let rawState = $derived(metadataViewStore.getDatasetState(datasetName));
	let isTableView = $derived(uiStore.uiState.metadataViewMode === 'table');

	let datasetMetadata = $derived(() => {
		if (!define) return null;

		const normalizedName = normalizeDatasetId(datasetName);
		return define.itemGroups?.find(
			(g: { Name: string }) => normalizeDatasetId(g.Name) === normalizedName
		);
	});

	function getBaseVariables() {
		if (!define || !datasetMetadata()) return [];

		const normalizedDatasetName = normalizeDatasetId(datasetName);

		const datasetRefs = define.itemRefs.filter((ref) => {
			let refDataset;
			if (sdtmDefine) {
				refDataset = ref.OID?.split('.')[0] || '';
			} else if (adamDefine) {
				refDataset = ref.OID?.split('.')[1] || '';
			}
			return normalizeDatasetId(refDataset) === normalizedDatasetName;
		});

		const itemDefsMap = new Map(define.itemDefs.map((def) => [def.OID, def]));
		const vlmVars = new Set(
			define.valueListDefs.map((vld) => vld.OID?.split(`VL.${datasetName}.`)[1]).filter(Boolean)
		);

		return datasetRefs
			.map((ref) => {
				const varName = ref.OID?.split('.')[2] || '';
				return {
					...ref,
					itemDef: itemDefsMap.get(ref.OID),
					hasVLM: vlmVars.has(varName)
				};
			})
			.sort((a, b) => {
				return parseInt(a.OrderNumber || '0') - parseInt(b.OrderNumber || '0');
			});
	}

	function getFilteredVariables() {
		const baseVars = getBaseVariables();
		if (!baseVars?.length) return [];

		const searchLower = rawState.searchTerm.toLowerCase();
		if (!searchLower) return baseVars;

		return baseVars.filter((variable) => {
			const name = variable.itemDef?.Name?.toLowerCase() || '';
			const description = variable.itemDef?.Description?.toLowerCase() || '';
			return name.includes(searchLower) || description.includes(searchLower);
		});
	}

	function areAllExpanded() {
		const filteredVars = getFilteredVariables();
		if (filteredVars.length === 0) return false;

		return filteredVars.every((variable) => {
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
					oninput={(e) => updateSearch(e.target.value)}
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
