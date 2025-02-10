<script lang="ts">
	import type { method } from '$lib/core/processors/defineXML/types';
	import { Badge } from '$lib/components/core/badge';
	import { ChevronDown, ChevronRight } from 'lucide-svelte';

	let { methodOID, methods, isExpanded, onToggle } = $props<{
		methodOID: string | null;
		methods: method[];
		isExpanded: boolean;
		onToggle: () => void;
	}>();

	let methodInfo = $derived(
		!methodOID || !methods?.length ? null : methods.find((m) => m.OID === methodOID)
	);

	let typeAbbrev = $derived(
		!methodInfo?.Type ? '' : methodInfo.Type === 'Computation' ? 'CMP' : 'IMP'
	);
</script>

{#if !methodOID || !methodInfo}
	<span class="text-xs">-</span>
{:else}
	<div class="cursor-pointer" onclick={onToggle} role="button" tabindex="0">
		<div class="flex items-center gap-2">
			<svelte:component this={isExpanded ? ChevronDown : ChevronRight} class="h-4 w-4 shrink-0" />
			<span class="font-mono text-xs">{methodInfo.Name}</span>
			<!--	{#if typeAbbrev}
				<Badge variant="outline" class="px-1 py-0 text-xs">
					{typeAbbrev}
				</Badge>
			{/if} -->
		</div>
	</div>
{/if}
