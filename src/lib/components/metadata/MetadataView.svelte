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

	let { sdtmDefine, adamDefine, datasetName } = $props<{
		sdtmDefine: ParsedDefineXML | null;
		adamDefine: ParsedDefineXML | null;
		datasetName: string;
	}>();

	// Using your original reactive declarations
	let rawState = $derived(metadataViewStore.getDatasetState(datasetName));
	let expandedMethods = $derived(() => {
		const methods = rawState.expandedMethods;
		return methods instanceof Set ? methods : new Set(Array.isArray(methods) ? methods : []);
	});
	let isTableView = $derived(uiStore.uiState.metadataViewMode === 'table');

	let define = $derived(sdtmDefine || adamDefine);
	let methods = $derived(define?.methods || []);
	let comments = $derived(define?.comments || []);
	let codeLists = $derived(define?.CodeLists || []);

	// Keep using your original datasetMetadata pattern
	let datasetMetadata = $derived(() => {
		if (!define) return null;

		const normalizedName = normalizeDatasetId(datasetName);
		return define.itemGroups?.find(
			(g: { Name: string }) => normalizeDatasetId(g.Name) === normalizedName
		);
	});

	// Use the function pattern for baseVariables to ensure proper reactivity
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

	// Function for filtered variables to ensure proper reactivity with search
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

	function toggleView() {
		uiStore.setMetadataViewMode(isTableView ? 'card' : 'table');
	}

	function updateSearch(term: string) {
		metadataViewStore.updateSearch(datasetName, term);
	}
</script>

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

	<!-- Content section -->
	<div class="flex-1 overflow-hidden px-4">
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
</div>
