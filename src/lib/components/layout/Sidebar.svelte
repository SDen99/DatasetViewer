<script lang="ts">
	import { ScrollArea } from '$lib/components/core/scroll-area';
	import { Button } from '$lib/components/core/button';
	import { PanelLeftOpen, PanelRightOpen } from 'svelte-lucide';
	import { uiStore } from '$lib/core/stores/UIStore.svelte';

	let { position, open } = $props<{
		position: 'left' | 'right';
		open: boolean;
	}>();

	const Icon = $derived(position === 'left' ? PanelLeftOpen : PanelRightOpen);
	const borderClass = $derived(position === 'right' ? 'border-l' : 'border-r');
</script>

<div class="relative {open ? 'w-80' : 'w-0'} transition-all duration-300 ease-in-out">
	<div class="p-4">
		<div class="mb-4 flex items-center justify-between">
			<slot name="header" />
			<Button variant="ghost" size="icon" onclick={() => uiStore.toggleSidebar(position)}>
				<Icon class="h-4 w-4" />
			</Button>
		</div>
		<slot />
	</div>
</div>
