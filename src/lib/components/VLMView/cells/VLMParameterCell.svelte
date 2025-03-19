<script lang="ts">
	let { row, column } = $props<{
		row: any;
		column: string;
	}>();
</script>

{#if column === 'PARAMCD'}
	<div>
		<div class="font-mono font-bold">
			{typeof row[column] === 'object'
				? row[column]?.paramcd || row[column]?.paramInfo?.codedValue || ''
				: String(row[column] || '')}
		</div>
	</div>
{:else if column === 'PARAM'}
	<div class="font-medium">
		{typeof row[column] === 'object'
			? row[column]?.paramInfo?.decode || ''
			: String(row[column] || '')}
	</div>
{/if}