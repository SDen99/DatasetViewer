<script lang="ts">
	import type {
		ParsedDefineXML,
		method,
		comment,
		CodeList,
		itemRef
	} from '$lib/core/processors/defineXML/types';
	import {
		Table,
		TableBody,
		TableCell,
		TableHead,
		TableHeader,
		TableRow
	} from '$lib/components/core/table';
	import { Badge } from '$lib/components/core/badge';
	import VariableDetails from '../shared/VariableDetails.svelte';
	import MethodCell from '$lib/components/data/MethodCell.svelte';
	import MethodExpansion from '../shared/MethodExpansion.svelte';
	import { metadataViewStore } from '$lib/core/stores/MetadataViewStore.svelte';

	let { define, datasetName, filteredVariables, methods, comments, codeLists } = $props<{
		define: ParsedDefineXML;
		datasetName: string;
		filteredVariables: itemRef[];
		methods: method[];
		comments: comment[];
		codeLists: CodeList[];
	}>();

	$effect(() => {
		// Only log on first render or when filteredVariables changes length
		let lastLength = 0;

		const currentLength = filteredVariables?.length || 0;
		if (currentLength !== lastLength) {
			console.log(`MetadataTable: filteredVariables length changed to ${currentLength}`);
			lastLength = currentLength;

			if (currentLength > 0) {
				// Just log the count, not the full objects
				console.log(`First variable name: ${filteredVariables[0]?.itemDef?.Name || 'unknown'}`);
			}
		}
	});
	let state = $derived(() => {
		const datasetState = metadataViewStore.getDatasetState(datasetName);
		// Ensure expandedMethods is always a Set
		return {
			...datasetState,
			expandedMethods:
				datasetState.expandedMethods instanceof Set ? datasetState.expandedMethods : new Set()
		};
	});

	function toggleMethod(variableOID: string, methodOID: string) {
		metadataViewStore.toggleMethod(datasetName, `${variableOID}-${methodOID}`);
	}
</script>

<div class="flex h-full flex-col rounded-lg border">
	<Table>
		<TableHeader class="sticky top-0 bg-white">
			<TableRow class="bg-muted/50">
				<TableHead style="min-width: 160px; width: 160px">Order</TableHead>
				<TableHead style="min-width: 128px; width: 128px">Name</TableHead>
				<TableHead>Label</TableHead>
				<TableHead style="min-width: 80px; width: 80px">Type</TableHead>
				<TableHead style="min-width: 80px; width: 80px">Length</TableHead>
				<TableHead style="min-width: 80px; width: 80px">Format</TableHead>
				<TableHead style="min-width: 64px; width: 64px">Req</TableHead>
				<TableHead style="min-width: 64px; width: 64px">Orig</TableHead>
				<TableHead style="min-width: 192px; width: 192px">Origin/Method</TableHead>
			</TableRow>
		</TableHeader>

		<TableBody class="overflow-y-auto">
			{#each filteredVariables as variable}
				<TableRow>
					<TableCell style="min-width: 160px; width: 160px" class="font-mono text-sm">
						<VariableDetails
							variable={variable.itemDef}
							displayMode="table-row"
							hasVLM={variable.hasVLM}
							orderNumber={variable.OrderNumber}
							keySequence={variable.KeySequence}
						/>
					</TableCell>

					<TableCell>
						{variable.itemDef?.Description || '-'}
					</TableCell>

					<TableCell style="min-width: 80px; width: 80px" class="text-sm">
						{variable.itemDef?.DataType || '-'}
					</TableCell>

					<TableCell style="min-width: 80px; width: 80px" class="text-sm">
						{variable.itemDef?.Length || '-'}
					</TableCell>

					<TableCell style="min-width: 80px; width: 80px" class="font-mono text-sm">
						{variable.itemDef?.Format || '-'}
					</TableCell>

					<TableCell style="min-width: 64px; width: 64px">
						<Badge
							variant={variable.Mandatory === 'Yes' ? 'default' : 'secondary'}
							class="px-1 py-0"
						>
							{variable.Mandatory === 'Yes' ? 'Y' : 'N'}
						</Badge>
					</TableCell>

					<TableCell style="min-width: 192px; width: 192px">
						{#if variable.itemDef?.Origin}
							<code class="text-xs">
								{variable.itemDef.Origin}
							</code>
						{:else if variable.MethodOID}
							<MethodCell
								methodOID={variable.MethodOID}
								{methods}
								isExpanded={state.expandedMethods.has(`${variable.OID}-${variable.MethodOID}`)}
								onToggle={() => toggleMethod(variable.OID, variable.MethodOID)}
							/>
						{:else if variable.itemDef?.Comment}
							<div class="text-xs">
								{comments.find((c) => c.OID === variable.itemDef?.Comment)?.Description ||
									'No comment description available'}
							</div>
						{/if}
					</TableCell>
				</TableRow>

				{#if variable.MethodOID && state.expandedMethods.has(`${variable.OID}-${variable.MethodOID}`)}
					<TableRow>
						<TableCell colspan="9" class="bg-muted/20 px-4 py-2">
							<MethodExpansion
								methodOID={variable.MethodOID}
								{methods}
								{comments}
								{codeLists}
								itemDef={variable.itemDef}
							/>
						</TableCell>
					</TableRow>
				{/if}
			{/each}
		</TableBody>
	</Table>
</div>
