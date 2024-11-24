<script lang="ts">
	export let data: any[];
	export let selectedColumns: Set<string>;

	function isColumnSelected(column: string): boolean {
		return selectedColumns.has(column);
	}
</script>

{#if data.length > 0}
	<table class="min-w-full bg-white">
		<thead>
			<tr>
				{#each Object.keys(data[0] || {}) as key}
					{#if isColumnSelected(key)}
						<th
							class="border-b border-gray-200 bg-gray-100 px-4 py-2 text-left text-sm font-semibold text-gray-700"
							>{key}</th
						>
					{/if}
				{/each}
			</tr>
		</thead>
		<tbody>
			{#each data.slice(0, 10) as row}
				<tr>
					{#each Object.entries(row) as [key, value]}
						{#if isColumnSelected(key)}
							<td class="border-b border-gray-200 px-4 py-2 text-sm text-gray-700">{value}</td>
						{/if}
					{/each}
				</tr>
			{/each}
		</tbody>
	</table>
{:else}
	<p class="text-gray-500">No data to display.</p>
{/if}
