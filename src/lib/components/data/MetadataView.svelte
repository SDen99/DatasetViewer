<script lang="ts">
	import type { ParsedDefineXML } from '$lib/core/processors/defineXML/types';
	import { normalizeDatasetId } from '$lib/core/utils/datasetUtils';

	let { sdtmDefine, adamDefine, datasetName } = $props<{
		sdtmDefine: ParsedDefineXML | null;
		adamDefine: ParsedDefineXML | null;
		datasetName: string;
	}>();

	let datasetMetadata = $derived(() => {
		const normalizedName = normalizeDatasetId(datasetName);

		const sdtmDataset = sdtmDefine?.itemGroups.find(
			(g: { Name: string }) => normalizeDatasetId(g.Name) === normalizedName
		);
		const adamDataset = adamDefine?.itemGroups.find(
			(g: { Name: string }) => normalizeDatasetId(g.Name) === normalizedName
		);

		console.log('MetadataView - Dataset lookup:', {
			normalizedName,
			sdtm: !!sdtmDataset,
			adam: !!adamDataset,
			foundDataset: sdtmDataset || adamDataset
		});

		return sdtmDataset || adamDataset;
	});

	let variables = $derived(() => {
		const define = sdtmDefine || adamDefine;
		if (!define || !datasetMetadata) {
			return [];
		}

		const vars = define.itemDefs.filter(
			(item: { Dataset: string }) =>
				normalizeDatasetId(item.Dataset) === normalizeDatasetId(datasetName)
		);
		return vars;
	});

	$effect.root(() => {
		$effect(() => {
			const hasSDTM = !!sdtmDefine;
			const hasADaM = !!adamDefine;
			//  storeCoordinator.updateDefineXMLStatus(hasSDTM, hasADaM);
		});
	});
</script>

{#if datasetMetadata()}
	<div class="max-h-[calc(100vh-12rem)] space-y-6 overflow-y-auto">
		<!-- Dataset Information -->
		<div>
			<h3 class="text-lg font-semibold">Dataset: {datasetMetadata().Name}</h3>
			<p class="text-sm text-muted-foreground">{datasetMetadata().Description}</p>
			{#if datasetMetadata().Class}
				<div class="mt-2">
					<span class="rounded-md bg-muted px-2 py-1 text-sm">
						{datasetMetadata().Class}
					</span>
				</div>
			{/if}
		</div>

		<!-- Variables -->
		<div>
			<h4 class="text-md mb-4 font-semibold">Variables</h4>
			<div class="rounded-md border">
				<table class="w-full">
					<thead class="bg-muted/50">
						<tr class="border-b">
							<th class="p-2 text-left">Name</th>
							<th class="p-2 text-left">Label</th>
							<th class="p-2 text-left">Type</th>
							<th class="p-2 text-left">Format</th>
						</tr>
					</thead>
					<tbody>
						{#each variables() as variable}
							<tr class="border-b">
								<td class="p-2">{variable.Name}</td>
								<td class="p-2">{variable.Description}</td>
								<td class="p-2">{variable.DataType}</td>
								<td class="p-2">{variable.Format || '-'}</td>
							</tr>
						{/each}
					</tbody>
				</table>
			</div>
		</div>
	</div>
{:else}
	<div class="flex h-[200px] items-center justify-center text-muted-foreground">
		<p>No metadata available for this dataset</p>
	</div>
{/if}
