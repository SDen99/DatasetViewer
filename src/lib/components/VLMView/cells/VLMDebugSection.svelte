<script lang="ts">
	let { 
		data,
		sectionId
	} = $props<{
		data: {
			OID?: string;
			valueListOID?: string;
			whereClause?: {
				whereClauseOID?: string;
			};
			methodOID?: string;
			comment?: {
				OID?: string;
			};
		};
		sectionId: string;
	}>();

	let isCollapsed = $state(true);

	function toggleSection() {
		isCollapsed = !isCollapsed;
	}
</script>

<div class="mt-2 text-xs text-gray-500">
	<button
		type="button"
		class="cursor-pointer text-left underline"
		onclick={toggleSection}
		onkeydown={(e) => e.key === 'Enter' && toggleSection()}
		aria-expanded={!isCollapsed}
	>
		Debug OIDs
	</button>
	<div class={isCollapsed ? 'hidden' : 'mt-1 pl-2'}>
		{#if data.OID}
			<div class="mb-1">ItemDef OID: {data.OID}</div>
		{/if}
		{#if data.valueListOID}
			<div class="mb-1">ValueList OID: {data.valueListOID}</div>
		{/if}
		{#if data.whereClause?.whereClauseOID}
			<div class="mb-1">
				WhereClause OID: {data.whereClause.whereClauseOID}
			</div>
		{/if}
		{#if data.methodOID}
			<div class="mb-1">Method OID: {data.methodOID}</div>
		{/if}
		{#if data.comment?.OID}
			<div class="mb-1">Comment OID: {data.comment.OID}</div>
		{/if}
	</div>
</div>