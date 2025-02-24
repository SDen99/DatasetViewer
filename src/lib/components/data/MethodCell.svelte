<script lang="ts">
	import type { Method } from '$lib/types/define-xml';
	import { ChevronDown, ChevronRight } from 'lucide-svelte';

	let { methodOID, methods, isExpanded, onToggle } = $props<{
		methodOID: string | null;
		methods: Method[];
		isExpanded: boolean;
		onToggle: () => void;
	}>();

	const methodInfo = $derived(
		!methodOID || !methods?.length ? null : methods.find((m) => m.OID === methodOID)
	);

	function handleKeydown(e: KeyboardEvent) {
		if (e.key === 'Enter' || e.key === ' ') {
			e.preventDefault();
			onToggle();
		}
	}

	function handleClick() {
		console.log('Method cell clicked', {
			methodOID,
			isExpanded,
			methodInfo: methodInfo?.Name || 'unknown'
		});
		onToggle();
	}
</script>

{#if !methodOID || !methodInfo}
	<span class="text-xs">-</span>
{:else}
	<div
		class="flex cursor-pointer items-center gap-2"
		role="button"
		tabindex="0"
		onclick={handleClick}
		onkeydown={handleKeydown}
	>
		<div class="h-4 w-4 shrink-0">
			{#if isExpanded}
				<ChevronDown />
			{:else}
				<ChevronRight />
			{/if}
		</div>
		<span class="whitespace-normal font-mono text-xs">{methodInfo.Name}</span>
	</div>
{/if}
