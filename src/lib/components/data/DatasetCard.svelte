<script lang="ts">
	import { Trash2 } from 'svelte-lucide';
	import * as Button from '$lib/components/core/button';
	import { Progress } from '$lib/components/core/progress';
	import { Badge } from '$lib/components/core/badge';
	import { datasetStore } from '$lib/core/stores/datasetStore.svelte';

	interface Props {
		name: string;
		isSelected?: boolean;
		isLoading?: boolean;
		loadingProgress?: number;
		showDelete?: boolean;
		metadata?: {
			itemCount?: number;
			category?: string;
		};
		onDelete?: (name: string) => void;
	}

	let {
		name,
		isSelected = false,
		isLoading = false,
		loadingProgress = 0,
		showDelete = false,
		metadata,
		onDelete
	}: Props = $props();
</script>

<div class="overflow-hidden rounded-lg border {isSelected ? 'border-primary' : 'border-border'}">
	<div class="flex flex-col gap-2">
		<div class="flex items-center justify-between p-3">
			<button
				type="button"
				class="flex-1 text-left hover:text-primary"
				onclick={() => datasetStore.selectDataset(name)}
				disabled={isLoading}
			>
				<div class="flex items-center gap-2">
					<span class="truncate font-medium">{name}</span>
					{#if isLoading}
						<Badge variant="secondary">Loading</Badge>
					{/if}
					{#if metadata?.itemCount}
						<span class="text-sm text-muted-foreground">({metadata.itemCount})</span>
					{/if}
				</div>
			</button>

			{#if showDelete && !isLoading && onDelete}
				<Button.Root
					variant="ghost"
					size="icon"
					class="h-8 w-8 text-muted-foreground hover:text-destructive"
					onclick={() => onDelete(name)}
				>
					<Trash2 class="h-4 w-4" />
				</Button.Root>
			{/if}
		</div>

		{#if isLoading && loadingProgress > 0}
			<div class="px-3 pb-3">
				<Progress value={loadingProgress} />
			</div>
		{/if}
	</div>
</div>
