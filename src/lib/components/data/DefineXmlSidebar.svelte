<script lang="ts">
	import type { ParsedDefineXML, ItemGroup } from '$lib/core/processors/defineXML/types';
	import DatasetCard from './DatasetCard.svelte';
	import { datasetStore } from '$lib/core/stores/datasetStore.svelte';

	let { sdtmDefine, adamDefine } = $props<{
		sdtmDefine: ParsedDefineXML | null;
		adamDefine: ParsedDefineXML | null;
	}>();

	let datasets = $derived.by(() => {
		const allDatasets: ItemGroup[] = [];
		if (sdtmDefine?.itemGroups) {
			allDatasets.push(...sdtmDefine.itemGroups);
		}
		if (adamDefine?.itemGroups) {
			allDatasets.push(...adamDefine.itemGroups);
		}
		return allDatasets;
	});

	let loadedDatasetNames = $derived.by(
		() => new Set(Object.values(datasetStore.datasets).map((ds) => ds.fileName))
	);
	// Group metadata
	let metadata = $derived.by(() => {
		const combined = {
			standards: [] as NonNullable<ParsedDefineXML['standards']>,
			methods: [] as NonNullable<ParsedDefineXML['methods']>,
			comments: [] as NonNullable<ParsedDefineXML['comments']>,
			codelists: [] as NonNullable<ParsedDefineXML['CodeLists']>,
			whereClauseDefs: [] as NonNullable<ParsedDefineXML['whereClauseDefs']>
		};

		if (sdtmDefine) {
			combined.standards.push(...(sdtmDefine.standards || []));
			combined.methods.push(...(sdtmDefine.methods || []));
			combined.comments.push(...(sdtmDefine.comments || []));
			combined.codelists.push(...(sdtmDefine.CodeLists || []));
			combined.whereClauseDefs.push(...(sdtmDefine.whereClauseDefs || []));
		}

		if (adamDefine) {
			combined.standards.push(...(adamDefine.standards || []));
			combined.methods.push(...(adamDefine.methods || []));
			combined.comments.push(...(adamDefine.comments || []));
			combined.codelists.push(...(adamDefine.CodeLists || []));
			combined.whereClauseDefs.push(...(adamDefine.whereClauseDefs || []));
		}

		return combined;
	});
</script>

<div class="h-full w-64 overflow-y-auto border-border p-4">
	<section class="space-y-2">
		<div class="space-y-1">
			{#each datasets as dataset}
				<DatasetCard
					name={dataset.SASDatasetName || dataset.Name || ''}
					isSelected={datasetStore.selectedDatasetId === dataset.SASDatasetName}
					metadata={{
						itemCount: dataset.ItemRefs?.length || 0,
						category: dataset.Class || undefined
					}}
				/>
			{/each}
		</div>
	</section>

	<section class="mt-6 space-y-2">
		<h3 class="text-lg font-semibold">Metadata</h3>
		{#each Object.entries(metadata) as [category, items]}
			{#if items.length > 0}
				<div class="flex items-center justify-between p-2">
					<h4 class="capitalize">{category}</h4>
					<span class="text-sm text-muted-foreground">({items.length})</span>
				</div>
			{/if}
		{/each}
	</section>
</div>
