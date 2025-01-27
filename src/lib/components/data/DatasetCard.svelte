<script lang="ts">
	import { Trash2 } from 'svelte-lucide';
	import * as Button from '$lib/components/core/button';
	import { Progress } from '$lib/components/core/progress';
	import { Badge } from '$lib/components/core/badge';
	import { datasetStore } from '$lib/core/stores/datasetStore.svelte';
	import { normalizeDatasetId } from '$lib/core/utils/datasetUtils';
	import type { ItemGroup } from '$lib/core/processors/defineXML/types';
	import { storeCoordinator } from '$lib/core/stores/storeCoordinator.svelte';

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

	let defineData = $derived(datasetStore.defineXmlDatasets);

	let isMetadataOnly = $derived.by(() => {
		const normalizedName = normalizeDatasetId(name);
		const hasMetadata =
			defineData.SDTM?.itemGroups?.some(
				(g: ItemGroup) => normalizeDatasetId(g.Name || '') === normalizedName
			) ||
			defineData.ADaM?.itemGroups?.some(
				(g: ItemGroup) => normalizeDatasetId(g.Name || '') === normalizedName
			);

		// Only show metadata badge if we have metadata but no actual dataset
		// Use the original name to check datasets, not the normalized name
		return (
			hasMetadata &&
			!Object.keys(datasetStore.datasets).some(
				(fileName) => normalizeDatasetId(fileName) === normalizedName
			)
		);
	});

	function handleClick() {
		console.log('DatasetCard clicked:', {
			name,
			isSelected,
			currentSelection: datasetStore.selectedDatasetId,
			isMetadataOnly
		});
		storeCoordinator.selectDataset(name);
	}
</script>

<div class="overflow-hidden rounded-lg border {isSelected ? 'border-primary' : 'border-border'}">
	<div class="flex flex-col gap-2">
		<div class="flex items-center justify-between p-3">
			<button
				type="button"
				class="flex-1 text-left hover:text-primary"
				onclick={handleClick}
				disabled={isLoading}
			>
				<div class="flex items-center gap-2">
					<span class="truncate font-medium">{name}</span>
					{#if isLoading}
						<Badge variant="secondary">Loading</Badge>
					{/if}
					{#if isMetadataOnly}
						<Badge variant="secondary">Metadata</Badge>
					{/if}
					{#if metadata?.itemCount}
						<span class="text-sm text-muted-foreground">({metadata.itemCount})</span>
					{/if}
				</div>
			</button>

			{#if showDelete && !isLoading && onDelete && !isMetadataOnly}
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
