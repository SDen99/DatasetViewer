<script lang="ts">
	import type { method } from '$lib/core/processors/defineXML/types';
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

	function handleKeydown(e: KeyboardEvent) {
		if (e.key === 'Enter' || e.key === ' ') {
			e.preventDefault();
			onToggle();
		}
	}
</script>

{#if !methodOID || !methodInfo}
	<span class="text-xs">-</span>
{:else}
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
		<span class="whitespace-normal font-mono text-xs">{methodInfo.Name}</span>
	</div>
{/if}
