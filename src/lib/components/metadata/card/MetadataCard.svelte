<script lang="ts">
	import type { ParsedDefineXML, itemRef } from '$lib/core/processors/defineXML/types';
	import { Card, CardContent } from '$lib/components/core/card';
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

	let state = $derived(metadataViewStore.getDatasetState(datasetName));

	function toggleMethod(variableOID: string, methodOID: string) {
		metadataViewStore.toggleMethod(datasetName, `${variableOID}-${methodOID}`);
	}
</script>

<div class="h-full overflow-y-auto">
	<div class="max-w-5xl space-y-2">
		{#each filteredVariables as variable}
			<Card>
				<CardContent class="p-4">
					<div class="flex flex-col gap-4">
						<div class="flex gap-8">
							<!-- Primary Variable Info -->
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
										isExpanded={state.expandedMethods.has(`${variable.OID}-${variable.MethodOID}`)}
										onToggle={() => toggleMethod(variable.OID, variable.MethodOID)}
									/>
								{/if}
							</div>
						</div>

						<!-- Expanded Method Details -->
						{#if variable.MethodOID && state.expandedMethods.has(`${variable.OID}-${variable.MethodOID}`)}
							<MethodExpansion
								methodOID={variable.MethodOID}
								{methods}
								{comments}
								{codeLists}
								itemDef={variable.itemDef}
							/>
						{/if}
					</div>
				</CardContent>
			</Card>
		{/each}
	</div>
</div>
