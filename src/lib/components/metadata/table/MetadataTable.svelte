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
	import { toggleMethodExpansion } from '../shared/methodExpansionUtils';

	let { define, datasetName, filteredVariables, methods, comments, codeLists } = $props<{
		define: ParsedDefineXML;
		datasetName: string;
		filteredVariables: itemRef[];
		methods: method[];
		comments: comment[];
		codeLists: CodeList[];
	}>();

	// Debug the store's state immediately
	console.log('Table view - store state direct access:', {
		datasetName,
		state: metadataViewStore.getDatasetState(datasetName)
	});

	// Access expandedMethods directly from the store, with safety checks
	function getExpandedMethodsSet() {
		const state = metadataViewStore.getDatasetState(datasetName);
		const methods = state.expandedMethods;

		console.log('Table view - raw expandedMethods:', {
			type: typeof methods,
			isSet: methods instanceof Set,
			isArray: Array.isArray(methods),
			value: methods
		});

		if (methods instanceof Set) return methods;
		if (Array.isArray(methods)) return new Set(methods);
		return new Set();
	}

	// Create simplified helper to check expansion
	function isExpanded(variableOID, methodOID) {
		if (!variableOID || !methodOID) return false;
		const key = `${variableOID}-${methodOID}`;
		const expandedSet = getExpandedMethodsSet();
		const result = expandedSet.has(key);
		console.log(`Table view - isExpanded check for ${key}: ${result}`);
		return result;
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
			{#each filteredVariables || [] as variable, idx (variable.OID)}
				<!-- Regular row with variable data -->
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

					<TableCell style="min-width: 128px; width: 128px">
						<div class="font-mono">
							{variable.itemDef?.Name || variable.OID?.split('.')[2] || ''}
						</div>
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
								isExpanded={isExpanded(variable.OID, variable.MethodOID)}
								onToggle={() => toggleMethodExpansion(variable, datasetName)}
							/>
						{:else if variable.itemDef?.Comment}
							<div class="text-xs">
								{comments.find((c) => c.OID === variable.itemDef?.Comment)?.Description ||
									'No comment description available'}
							</div>
						{/if}
					</TableCell>
				</TableRow>

				<!-- Expansion row - only rendered if method is expanded -->
				{#if variable.MethodOID && isExpanded(variable.OID, variable.MethodOID)}
					<TableRow data-expanded-row style="border: 2px solid green;">
						<TableCell colspan="9" class="bg-muted/20 px-4 py-2">
							<div class="bg-red-100 p-2 text-xs">
								DEBUG: Method {variable.MethodOID} is expanded in table view!
							</div>
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
