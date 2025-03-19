<script lang="ts">
	let {
		paramcdFilter,
		columns,
		visibleColumnState,
		onFilterChange,
		onToggleColumn,
		onShowAllColumns
	} = $props<{
		paramcdFilter: string;
		columns: string[];
		visibleColumnState: Record<string, boolean>;
		onFilterChange?: (value: string) => void;
		onToggleColumn?: (column: string) => void;
		onShowAllColumns?: () => void;
	}>();

	// Handle PARAMCD filter change
	function handleParamcdFilterChange(e: Event) {
		const target = e.target as HTMLInputElement;
		onFilterChange?.(target.value);
	}

	// Toggle column visibility
	function toggleColumnVisibility(column: string) {
		onToggleColumn?.(column);
	}

	// Show all columns
	function handleShowAllColumns() {
		onShowAllColumns?.();
	}
</script>

<div class="space-y-4">
	<!-- PARAMCD Filter -->
	<div class="mb-4">
		<div class="flex items-center gap-2">
			<label for="paramcd-filter" class="font-medium">Filter PARAMCD:</label>
			<input
				id="paramcd-filter"
				type="text"
				class="flex h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
				placeholder="Enter PARAMCD..."
				value={paramcdFilter}
				oninput={handleParamcdFilterChange}
			/>
			{#if paramcdFilter.trim()}
				<button
					type="button"
					class="text-sm text-muted-foreground hover:text-primary-foreground"
					onclick={() => onFilterChange?.('')}
				>
					Clear
				</button>
			{/if}
		</div>
	</div>

	<!-- Column Visibility Controls -->
	<div class="mb-4">
		<div class="flex items-center">
			<h3 class="mr-3 font-medium">Columns</h3>
			<button
				type="button"
				id="force-show-all-btn"
				class="mr-4 rounded-md bg-primary px-3 py-1 text-sm text-primary-foreground hover:bg-primary/90"
				onclick={handleShowAllColumns}
			>
				Show All Columns
			</button>

			<div class="flex-grow"></div>
		</div>

		<div class="mt-2 flex flex-wrap gap-2">
			{#each columns.filter((col) => !['PARAMCD', 'PARAM'].includes(col)) || [] as column}
				<label
					class="flex items-center gap-1.5 rounded-md border bg-card px-2 py-1 text-sm shadow-sm"
				>
					<input
						type="checkbox"
						checked={visibleColumnState[column] !== false}
						onclick={() => toggleColumnVisibility(column)}
					/>
					{column}
				</label>
			{/each}
		</div>
	</div>
</div>