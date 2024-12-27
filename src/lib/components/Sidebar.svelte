<script lang="ts">
	import { ScrollArea } from '$lib/components/ui/scroll-area';
	import { Button } from '$lib/components/ui/button';
	import { PanelLeftOpen, PanelRightOpen } from 'lucide-svelte';
	import { dataTableStore } from '$lib/stores/dataTableStore.svelte';

	interface Props {
		position: 'left' | 'right';
		open: boolean;
		title: string;
		children?: import('svelte').Snippet;
	}

	let { position, open, title, children }: Props = $props();

	const Icon = position === 'left' ? PanelLeftOpen : PanelRightOpen;

	let borderClass = $derived(position === 'right' ? 'border-l' : 'border-r');
</script>

<div class="relative {open ? 'w-80' : 'w-0'} transition-all duration-300 ease-in-out">
	<ScrollArea class="h-[calc(100vh-8rem)] border-border bg-card {borderClass}">
		<div class="p-4">
			<div class="mb-4 flex items-center justify-between">
				<h2 class="text-lg font-semibold">{title}</h2>
				<Button variant="ghost" size="icon" on:click={() => dataTableStore.toggleSidebar(position)}>
					<Icon class="h-4 w-4" />
				</Button>
			</div>
			{@render children?.()}
		</div>
	</ScrollArea>
</div>
