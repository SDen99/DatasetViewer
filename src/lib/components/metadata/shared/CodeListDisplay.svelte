<script lang="ts">
	import type { CodeList } from '$lib/core/processors/defineXML/types';
	import { Badge } from '$lib/components/core/badge';

	let { codelist } = $props<{
		codelist: CodeList;
	}>();
</script>

<div class="space-y-2">
	<div class="text-sm font-medium">{codelist.Name}</div>

	{#if codelist.CodeListItems?.length}
		<div class="space-y-1">
			<div class="text-sm font-medium text-muted-foreground">Coded Values:</div>
			{#each codelist.CodeListItems as item}
				<div class="grid grid-cols-[100px,1fr] gap-2 text-sm">
					<code class="text-xs">{item.CodedValue}</code>
					<div>
						{item.Decode?.TranslatedText}
						{#if item.ExtendedValue}
							<Badge class="ml-2 px-1 py-0">Extended</Badge>
						{/if}
						{#if item.Aliases?.length}
							<div class="mt-1 text-xs text-muted-foreground">
								Aliases: {item.Aliases.map((a) => `${a.Name} (${a.Context})`).join(', ')}
							</div>
						{/if}
					</div>
				</div>
			{/each}
		</div>
	{/if}

	{#if codelist.EnumeratedItems?.length}
		<div class="space-y-1">
			<div class="text-sm font-medium text-muted-foreground">Enumerated Items:</div>
			{#each codelist.EnumeratedItems as item}
				<div class="flex gap-2 whitespace-nowrap text-sm">
					<code class="w-[100px] shrink-0 text-xs">{item.CodedValue}</code>
					{#if item.Aliases?.length}
						<div class="overflow-hidden text-ellipsis text-xs text-muted-foreground">
							Aliases: {item.Aliases.map((a) => `${a.Name} (${a.Context})`).join(', ')}
						</div>
					{/if}
				</div>
			{/each}
		</div>
	{/if}

	{#if codelist.Aliases?.length}
		<div class="space-y-1">
			<div class="text-sm font-medium text-muted-foreground">CodeList Aliases:</div>
			<div class="text-xs text-muted-foreground">
				{codelist.Aliases.map((a) => `${a.Name} (${a.Context})`).join(', ')}
			</div>
		</div>
	{/if}
</div>
