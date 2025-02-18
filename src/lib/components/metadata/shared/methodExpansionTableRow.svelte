<script lang="ts">
	import type { itemRef, method, comment, CodeList } from '$lib/core/processors/defineXML/types';
	import MethodExpansion from './MethodExpansion.svelte';
	import { isMethodExpanded } from './methodExpansionUtils';
	import { TableRow, TableCell } from '$lib/components/core/table';

	let { variable, datasetName, methods, comments, codeLists, expandedMethods } = $props<{
		variable: itemRef;
		datasetName: string;
		methods: method[];
		comments: comment[];
		codeLists: CodeList[];
		expandedMethods: Set<string>;
	}>();

	let shouldExpand = $derived(
		variable.MethodOID && isMethodExpanded(variable, datasetName, expandedMethods)
	);

	$effect(() => {
		if (shouldExpand) {
			console.log(`TableRow: Rendering expanded content for ${variable.OID}-${variable.MethodOID}`);
		}
	});
</script>

{#if shouldExpand}
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
