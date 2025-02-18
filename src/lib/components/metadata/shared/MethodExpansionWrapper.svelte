<script lang="ts">
	import type { itemRef, method, comment, CodeList } from '$lib/core/processors/defineXML/types';
	import MethodExpansion from './MethodExpansion.svelte';
	import { isMethodExpanded } from './methodExpansionUtils';

	let {
		variable,
		datasetName,
		methods,
		comments,
		codeLists,
		expandedMethods,
		isTableView = false
	} = $props<{
		variable: itemRef;
		datasetName: string;
		methods: method[];
		comments: comment[];
		codeLists: CodeList[];
		expandedMethods: Set<string>;
		isTableView?: boolean;
	}>();

	let shouldExpand = $derived(
		variable.MethodOID && isMethodExpanded(variable, datasetName, expandedMethods)
	);

	$effect(() => {
		if (shouldExpand) {
			console.log(
				`MethodExpansionWrapper: Rendering expanded content for ${variable.OID}-${variable.MethodOID}`
			);
		}
	});
</script>

{#if shouldExpand}
	{#if isTableView}
		<tr>
			<td colspan="9" class="bg-muted/20 px-4 py-2">
				<MethodExpansion
					methodOID={variable.MethodOID}
					{methods}
					{comments}
					{codeLists}
					itemDef={variable.itemDef}
				/>
			</td>
		</tr>
	{:else}
		<div class="mt-4 border-t pt-4">
			<MethodExpansion
				methodOID={variable.MethodOID}
				{methods}
				{comments}
				{codeLists}
				itemDef={variable.itemDef}
			/>
		</div>
	{/if}
{/if}
