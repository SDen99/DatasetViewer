<script lang="ts">
	import type { method, comment, CodeList } from '$lib/core/processors/defineXML/types';

	let {
		methodOID,
		methods = [],
		comments = [],
		codeLists = [],
		itemDef
	} = $props<{
		methodOID: string;
		methods: method[];
		comments: comment[];
		codeLists: CodeList[];
		itemDef?: itemDef;
	}>();

	let methodInfo = $derived(methods?.find((m) => m.OID === methodOID));

	function getCodeList(itemDef: itemDef | undefined) {
		if (!itemDef?.CodeListOID) return null;
		return codeLists?.find((cl) => cl.OID === itemDef.CodeListOID) || null;
	}

	$effect(() => {
		console.log('Method expansion props:', {
			methodOID,
			methodsAvailable: methods?.length || 0,
			commentsAvailable: comments?.length || 0,
			codeListsAvailable: codeLists?.length || 0,
			itemDefPresent: !!itemDef
		});
	});
</script>

<div class="grid gap-4 {itemDef?.CodeListOID ? 'grid-cols-2' : 'grid-cols-1'}">
	<!-- Method Description -->
	<div class="space-y-2">
		<h4 class="text-sm font-medium">Method</h4>
		<pre class="whitespace-pre-wrap text-sm font-normal text-muted-foreground">
            {methodInfo?.Description || 'No description available'}
        </pre>

		{#if itemDef?.Comment}
			<div class="mt-2 space-y-1">
				<div class="text-sm text-muted-foreground">
					Comment:
					{comments.find((c) => c.OID === itemDef?.Comment)?.Description ||
						'No comment description available'}
				</div>
			</div>
		{/if}
	</div>

	<!-- CodeList Details -->
	{#if itemDef?.CodeListOID}
		<div class="space-y-2 border-l pl-4">
			{#if getCodeList(itemDef)}
				{@const codeList = getCodeList(itemDef)}
				<div class="space-y-2">
					<div class="text-sm font-medium">{codeList.Name}</div>
					<!-- ... rest of the codelist content ... -->
				</div>
			{:else}
				<div class="text-sm text-muted-foreground">No codelist defined</div>
			{/if}
		</div>
	{/if}
</div>
