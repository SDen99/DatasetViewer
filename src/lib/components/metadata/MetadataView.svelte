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

	let state = $derived(metadataViewStore.getDatasetState(datasetName));
	let isTableView = $derived(uiStore.uiState.metadataViewMode === 'table');

	let define = $derived(sdtmDefine || adamDefine);
	let methods = $derived(define?.methods || []);
	let comments = $derived(define?.comments || []);
	let codeLists = $derived(define?.CodeLists || []);

	// Process base variables
	let baseVariables = $derived(() => {
		if (!define || !datasetName) return [];

		const normalizedDatasetName = normalizeDatasetId(datasetName);

		// Get dataset refs for the current dataset
		const datasetRefs = define.itemRefs.filter((ref) => {
			let refDataset;
			if (sdtmDefine) {
				refDataset = ref.OID?.split('.')[0] || '';
			} else if (adamDefine) {
				refDataset = ref.OID?.split('.')[1] || '';
			}
			return normalizeDatasetId(refDataset) === normalizedDatasetName;
		});

		// Create a map of item definitions for quick lookup
		const itemDefsMap = new Map(define.itemDefs.map((def) => [def.OID, def]));

		// Get VLM variables for the current dataset
		const vlmVars = new Set(
			define.valueListDefs.map((vld) => vld.OID?.split(`VL.${datasetName}.`)[1]).filter(Boolean)
		);

		// Map refs to their full information
		return datasetRefs
			.map((ref) => ({
				...ref,
				itemDef: itemDefsMap.get(ref.OID),
				hasVLM: vlmVars.has(ref.OID?.split('.')[2] || '')
			}))
			.sort((a, b) => {
				return parseInt(a.OrderNumber || '0') - parseInt(b.OrderNumber || '0');
			});
	});

	// Filter variables based on search
	let filteredVariables = $derived(() => {
		if (!baseVariables?.length) return [];

		const searchLower = state.searchTerm.toLowerCase();
		if (!searchLower) return baseVariables;

		return baseVariables.filter((variable) => {
			const name = variable.itemDef?.Name?.toLowerCase() || '';
			const description = variable.itemDef?.Description?.toLowerCase() || '';
			return name.includes(searchLower) || description.includes(searchLower);
		});
	});

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
					value={state.searchTerm}
					on:input={(e) => updateSearch(e.target.value)}
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
					{filteredVariables}
					{methods}
					{comments}
					{codeLists}
				/>
			{:else}
				<MetadataCard {define} {datasetName} {filteredVariables} {methods} {comments} {codeLists} />
			{/if}
		{:else}
			<div class="flex h-[200px] items-center justify-center text-muted-foreground">
				<p>No metadata available for this dataset</p>
			</div>
		{/if}
	</div>
</div>
