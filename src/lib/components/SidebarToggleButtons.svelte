<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import { PanelLeftClose, PanelRightClose, PanelLeftOpen, PanelRightOpen } from 'lucide-svelte';
	import { dataTableStore } from '$lib/stores/dataTableStore.svelte';
</script>

<div class="fixed bottom-4 left-4 z-50 flex gap-2">
	{#if dataTableStore.uiState.leftSidebarOpen}
		<Button
			variant="default"
			size="icon"
			on:click={() => dataTableStore.toggleSidebar('left')}
			aria-label="Hide left sidebar"
		>
			<PanelLeftOpen class="h-4 w-4" />
		</Button>
	{:else}
		<Button
			variant="default"
			size="icon"
			on:click={() => dataTableStore.toggleSidebar('left')}
			aria-label="Show left sidebar"
		>
			<PanelLeftClose class="h-4 w-4" />
		</Button>
	{/if}

	{#if dataTableStore.uiState.rightSidebarOpen}
		<Button
			variant="default"
			size="icon"
			on:click={() => dataTableStore.toggleSidebar('right')}
			aria-label="Hide right sidebar"
		>
			<PanelRightOpen class="h-4 w-4" />
		</Button>
	{:else}
		<Button
			variant="default"
			size="icon"
			on:click={() => dataTableStore.toggleSidebar('right')}
			aria-label="Show right sidebar"
		>
			<PanelRightClose class="h-4 w-4" />
		</Button>
	{/if}
</div>
