<script lang="ts">
	import type { method, CodeList } from '$lib/core/processors/defineXML/types';
	import { ChevronDown, ChevronRight, ListTree, CodepenIcon } from 'lucide-svelte';
	import { Badge } from '$lib/components/core/badge';

	let { type, content, isExpanded, onToggle } = $props<{
		type: 'method' | 'codelist';
		content: {
			method?: method;
			codelist?: CodeList;
		};
		isExpanded: boolean;
		onToggle: () => void;
	}>();

	function handleKeydown(e: KeyboardEvent) {
		if (e.key === 'Enter' || e.key === ' ') {
			e.preventDefault();
			onToggle();
		}
	}

	// Get display name based on type
	let displayName = $derived(() => {
		if (type === 'method') {
			return content.method?.Name || 'Unknown Method';
		}
		return content.codelist?.Name || 'Unknown Codelist';
	});
</script>

<div
	class="flex cursor-pointer items-center gap-2"
	role="button"
	tabindex="0"
	onclick={onToggle}
	onkeydown={handleKeydown}
>
	{#if isExpanded}
		<ChevronDown class="h-4 w-4 shrink-0" />
	{:else}
		<ChevronRight class="h-4 w-4 shrink-0" />
	{/if}

	{#if type === 'method'}
		<CodepenIcon class="h-4 w-4 text-muted-foreground" />
	{:else}
		<ListTree class="h-4 w-4 text-muted-foreground" />
	{/if}

	<span class="whitespace-normal font-mono text-xs">{displayName}</span>

	<Badge variant="outline" class="px-1 py-0 text-xs" style="opacity: 0.7">
		{type === 'method' ? 'Method' : 'Codelist'}
	</Badge>
</div>
