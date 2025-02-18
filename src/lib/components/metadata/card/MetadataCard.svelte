<script lang="ts">
	import type {
		ParsedDefineXML,
		method,
		comment,
		CodeList,
		itemRef
	} from '$lib/core/processors/defineXML/types';
	import { Card, CardContent } from '$lib/components/core/card';
	import VariableDetails from '../shared/VariableDetails.svelte';
	import MethodCell from '$lib/components/data/MethodCell.svelte';
	import MethodExpansion from '../shared/MethodExpansion.svelte';
	import { metadataViewStore } from '$lib/core/stores/MetadataViewStore.svelte';
	import { isMethodExpanded, toggleMethodExpansion } from '../shared/methodExpansionUtils';

	let { define, datasetName, filteredVariables, methods, comments, codeLists } = $props<{
		define: ParsedDefineXML;
		datasetName: string;
		filteredVariables: itemRef[];
		methods: method[];
		comments: comment[];
		codeLists: CodeList[];
	}>();

	// Debug the store's state immediately
	console.log('Store state direct access:', {
		datasetName,
		state: metadataViewStore.getDatasetState(datasetName)
	});

	// Access expandedMethods directly from the store, with safety checks
	function getExpandedMethodsSet() {
		const state = metadataViewStore.getDatasetState(datasetName);
		const methods = state.expandedMethods;

		console.log('Raw expandedMethods:', {
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
		console.log(`isExpanded check for ${key}: ${result}`);
		return result;
	}
</script>

<div class="h-full overflow-y-auto">
	<div class="max-w-5xl space-y-2">
		{#each filteredVariables as variable}
			<Card>
				<CardContent class="p-4">
					<div class="flex flex-col gap-4">
						<!-- Primary Variable Info -->
						<div class="flex gap-8">
							<div class="w-48 shrink-0">
								<VariableDetails
									variable={variable.itemDef}
									displayMode="card"
									hasVLM={variable.hasVLM}
									orderNumber={variable.OrderNumber}
									keySequence={variable.KeySequence}
								/>
							</div>

							<!-- Origin/Method Section -->
							<div class="w-64">
								{#if variable.itemDef?.Origin}
									<span class="text-sm text-muted-foreground">Origin:</span>
									<code class="mt-1 block text-xs">
										{variable.itemDef.Origin}
									</code>
								{:else if variable.MethodOID}
									<MethodCell
										methodOID={variable.MethodOID}
										{methods}
										isExpanded={isExpanded(variable.OID, variable.MethodOID)}
										onToggle={() => toggleMethodExpansion(variable, datasetName)}
									/>
								{/if}
							</div>
						</div>

						<!-- Expanded Method Details -->
						{#if variable.MethodOID && isExpanded(variable.OID, variable.MethodOID)}
							<div class="mt-4 border-t pt-4" style="border: 2px solid blue;">
								<div class="bg-red-100 p-2 text-xs">
									DEBUG: Method {variable.MethodOID} is expanded!
								</div>
								<MethodExpansion
									methodOID={variable.MethodOID}
									{methods}
									{comments}
									{codeLists}
									itemDef={variable.itemDef}
								/>
							</div>
						{/if}
					</div>
				</CardContent>
			</Card>
		{/each}
	</div>
</div>
