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
	let disableTransition = $state(false);

	const resizeHandleClasses = $derived(`
  absolute ${position === 'right' ? 'left-0' : 'right-0'} 
  top-0 h-full !w-1.5 // Added ! to force override
  resize-handle
  cursor-col-resize 
  hover:bg-muted-foreground/10 active:bg-muted-foreground/20
  p-0 m-0  // Reset padding and margin
  min-w-0  // Override Button min-width
  ${resizing ? 'bg-primary/50' : ''}
`);

	function startResize(event: MouseEvent) {
		event.preventDefault();
		resizing = true;
		disableTransition = true;

		const MIN_WIDTH = 200;
		const MAX_WIDTH = 600;
		const startX = event.clientX;
		const startWidth = currentWidth;

		function onMouseMove(e: MouseEvent) {
			if (!resizing) return;

			const delta = position === 'left' ? e.clientX - startX : startX - e.clientX;

			currentWidth = Math.min(Math.max(startWidth + delta, MIN_WIDTH), MAX_WIDTH);
		}

		function onMouseUp() {
			resizing = false;
			setTimeout(() => {
				disableTransition = false;
			}, 50);

			uiStore.updateSidebarWidth(position, currentWidth);
			window.removeEventListener('mousemove', onMouseMove);
			window.removeEventListener('mouseup', onMouseUp);
		}

		window.addEventListener('mousemove', onMouseMove);
		window.addEventListener('mouseup', onMouseUp);
	}

	function handleKeyDown(event: KeyboardEvent) {
		if (!open) return;

		const STEP = 10;
		if (event.key === 'ArrowLeft') {
			event.preventDefault();
			const newWidth = Math.max(currentWidth - STEP, 200);
			currentWidth = newWidth;
			uiStore.updateSidebarWidth(position, newWidth);
		} else if (event.key === 'ArrowRight') {
			event.preventDefault();
			const newWidth = Math.min(currentWidth + STEP, 600);
			currentWidth = newWidth;
			uiStore.updateSidebarWidth(position, newWidth);
		}
	}

	$effect(() => {
		if (!resizing) {
			currentWidth =
				position === 'left' ? uiStore.uiState.leftSidebarWidth : uiStore.uiState.rightSidebarWidth;
		}
	});
</script>

<div
	bind:this={containerRef}
	role="complementary"
	aria-label="{position} sidebar"
	class="relative overflow-hidden"
	style:width={open ? `${currentWidth}px` : '0'}
	style:transition={disableTransition ? 'none' : 'width 300ms cubic-bezier(0.4, 0, 0.2, 1)'}
>
	<div
		class="absolute inset-0 transition-opacity duration-300"
		class:opacity-0={!open}
		class:opacity-100={open}
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
		<Button
			variant="ghost"
			role="separator"
			aria-orientation="vertical"
			aria-valuemin={200}
			aria-valuemax={600}
			aria-valuenow={currentWidth}
			aria-label="Resize {position} sidebar"
			class={resizeHandleClasses}
			onmousedown={startResize}
			onkeydown={handleKeyDown}
			tabindex={0}
		/>
	{/if}
</div>
