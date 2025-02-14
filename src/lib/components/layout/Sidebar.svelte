<script lang="ts">
	import { ScrollArea } from '$lib/components/core/scroll-area';
	import { Button } from '$lib/components/core/button';
	import { PanelLeftOpen, PanelRightOpen } from 'svelte-lucide';
	import { uiStore } from '$lib/core/stores/UIStore.svelte';
	import type { Snippet } from 'svelte';

	let { position, open, headerContent, sidebarContent } = $props<{
		position: 'left' | 'right';
		open: boolean;
		headerContent: Snippet;
		sidebarContent: Snippet;
	}>();

	const Icon = $derived(position === 'left' ? PanelLeftOpen : PanelRightOpen);
	let resizing = $state(false);
	let currentWidth = $state(
		position === 'left' ? uiStore.uiState.leftSidebarWidth : uiStore.uiState.rightSidebarWidth
	);
	let containerRef: HTMLDivElement;

	function startResize(event: MouseEvent) {
		event.preventDefault();

		const MIN_WIDTH = 200;
		const MAX_WIDTH = 600;
		const startX = event.clientX;
		const startWidth = currentWidth;

		resizing = true;

		function onMouseMove(e: MouseEvent) {
			if (!resizing) return;

			const delta = position === 'left' ? e.clientX - startX : startX - e.clientX;
			currentWidth = Math.min(Math.max(startWidth + delta, MIN_WIDTH), MAX_WIDTH);
		}

		function onMouseUp() {
			resizing = false;
			uiStore.updateSidebarWidth(position, currentWidth);
			window.removeEventListener('mousemove', onMouseMove);
			window.removeEventListener('mouseup', onMouseUp);
		}

		window.addEventListener('mousemove', onMouseMove);
		window.addEventListener('mouseup', onMouseUp);
	}

	$effect(() => {
		if (!resizing) {
			currentWidth =
				position === 'left' ? uiStore.uiState.leftSidebarWidth : uiStore.uiState.rightSidebarWidth;
		}
	});

	$effect(() => {
		console.log('Width transition:', { open, currentWidth });
	});
</script>

<div
	bind:this={containerRef}
	class="relative overflow-hidden"
	style="width: {open ? `${currentWidth}px` : '0'}; 
           max-width: {currentWidth}px; 
           transition: width 300ms cubic-bezier(0.4, 0, 0.2, 1);"
>
	<div
		class="absolute inset-0 {open ? 'opacity-100' : 'opacity-0'} transition-opacity duration-300"
	>
		<div class="w-full p-4">
			<div class="mb-4 flex items-center justify-between">
				{@render headerContent()}
				<Button variant="ghost" size="icon" onclick={() => uiStore.toggleSidebar(position)}>
					<Icon class="h-4 w-4" />
				</Button>
			</div>
			<div class="w-full">
				{@render sidebarContent()}
			</div>
		</div>
	</div>

	{#if open}
		<button
			type="button"
			role="separator"
			aria-orientation="vertical"
			aria-valuemin={200}
			aria-valuemax={600}
			aria-valuenow={currentWidth}
			aria-label="Resize sidebar"
			class="absolute {position === 'right' ? 'left-0' : 'right-0'} top-0 h-full w-1
                   cursor-col-resize hover:bg-muted-foreground/10 active:bg-muted-foreground/20
                   {resizing ? 'bg-primary/50' : ''} focus:outline-none"
			onMouseDown={(e) => startResize(e)}
		></button>
	{/if}
</div>
