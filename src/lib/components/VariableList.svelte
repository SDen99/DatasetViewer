<script lang="ts">
	export let variables: string[];
	export let selectedColumns: Set<string>;
	export let onColumnToggle: (column: string, checked: boolean) => void;
</script>

<aside class="w-1/4 bg-white p-4 shadow-md">
	<h2 class="mb-4 text-xl font-bold">Variables</h2>
	<ul class="pl-5">
		{#each variables as variable}
			<li>
				<label>
					<input
						type="checkbox"
						name={variable}
						value={variable}
						checked={selectedColumns.has(variable)}
						on:change={(e) => onColumnToggle(variable, (e.target as HTMLInputElement).checked)}
					/>
					{variable}
				</label>
			</li>
		{/each}
	</ul>
</aside>
