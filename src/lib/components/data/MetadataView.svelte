<script lang="ts">
	import type { ParsedDefineXML, itemDef, itemRef } from '$lib/core/processors/defineXML/types';
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

		return sdtmDataset || adamDataset;
	});

	// Enhanced variables to include both ItemRef and ItemDef data
	interface EnhancedVariable extends itemRef {
		itemDef?: itemDef;
		hasVLM: boolean;
	}

	let variables = $derived(() => {
		const define = sdtmDefine || adamDefine;
		if (!define || !datasetMetadata) {
			return [];
		}

		// Filter ItemRefs for the current dataset
		const datasetRefs = define.itemRefs.filter((ref) => {
			// ItemOID format: "IT.DATASETNAME.VARNAME"
			const refDataset = ref.OID?.split('.')[1] || '';
			return normalizeDatasetId(refDataset) === normalizeDatasetId(datasetName);
		});

		// Join with ItemDefs and check for VLM
		const enhancedVariables: EnhancedVariable[] = datasetRefs.map((ref) => {
			const itemDef = define.itemDefs.find((def) => def.OID === ref.OID);

			// Check if variable has value level metadata
			const varName = ref.OID?.split('.')[2] || '';
			const hasVLM = define.valueListDefs.some((vld) =>
				vld.OID?.includes(`VL.${datasetName}.${varName}`)
			);

			return {
				...ref,
				itemDef,
				hasVLM
			};
		});

		// Sort by OrderNumber
		return enhancedVariables.sort((a, b) => {
			const orderA = parseInt(a.OrderNumber || '0');
			const orderB = parseInt(b.OrderNumber || '0');
			return orderA - orderB;
		});
	});

	$effect.root(() => {
		$effect(() => {
			const hasSDTM = !!sdtmDefine;
			const hasADaM = !!adamDefine;
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
							<th class="p-2 text-left">Order</th>
							<th class="p-2 text-left">Key</th>
							<th class="p-2 text-left">Name</th>
							<th class="p-2 text-left">VLM</th>
							<th class="p-2 text-left">Label</th>
							<th class="p-2 text-left">Type</th>
							<th class="p-2 text-left">Length</th>
							<th class="p-2 text-left">Format</th>
							<th class="p-2 text-left">Mandatory</th>
							<th class="p-2 text-left">Origin Type</th>
							<th class="p-2 text-left">Origin</th>
							<th class="p-2 text-left">Method OID</th>
							<th class="p-2 text-left">Where Clause OID</th>
						</tr>
					</thead>
					<tbody>
						{#each variables() as variable}
							<tr class="border-b">
								<td class="p-2">{variable.OrderNumber}</td>
								<td class="p-2">{variable.KeySequence || '-'}</td>
								<td class="p-2">{variable.itemDef?.Name || variable.OID?.split('.')[2] || ''}</td>
								<td class="p-2">
									{#if variable.hasVLM}
										<span class="rounded-full bg-blue-100 px-2 py-0.5 text-xs text-blue-800"
											>VLM</span
										>
									{:else}
										-
									{/if}
								</td>
								<td class="p-2">{variable.itemDef?.Description || '-'}</td>
								<td class="p-2">{variable.itemDef?.DataType || '-'}</td>
								<td class="p-2">{variable.itemDef?.Length || '-'}</td>
								<td class="p-2">{variable.itemDef?.Format || '-'}</td>
								<td class="p-2">{variable.Mandatory}</td>
								<td class="p-2">{variable.itemDef?.OriginType || '-'}</td>
								<td class="p-2">{variable.itemDef?.Origin || '-'}</td>
								<td class="p-2">{variable.MethodOID || '-'}</td>
								<td class="p-2">{variable.WhereClauseOID || '-'}</td>
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
