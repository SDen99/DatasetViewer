<script lang="ts">
	import { Button } from '$lib/components/core/button';
	import { PanelLeftClose, PanelRightClose, PanelLeftOpen, PanelRightOpen } from 'svelte-lucide';
	import { tableUIStore } from '$lib/core/stores/tableUIStore.svelte';
</script>

<div class="fixed bottom-4 left-4 z-50 flex gap-2">
	{#if tableUIStore.uiState.leftSidebarOpen}
		<Button
			variant="default"
			size="icon"
			onclick={() => tableUIStore.toggleSidebar('left')}
			aria-label="Hide left sidebar"
		>
			<PanelLeftOpen class="h-4 w-4" />
		</Button>
	{:else}
		<Button
			variant="default"
			size="icon"
			onclick={() => tableUIStore.toggleSidebar('left')}
			aria-label="Show left sidebar"
		>
			<PanelLeftClose class="h-4 w-4" />
		</Button>
	{/if}

	{#if tableUIStore.uiState.rightSidebarOpen}
		<Button
			variant="default"
			size="icon"
			onclick={() => tableUIStore.toggleSidebar('right')}
			aria-label="Hide right sidebar"
		>
			<PanelRightOpen class="h-4 w-4" />
		</Button>
	{:else}
		<Button
			variant="default"
			size="icon"
			onclick={() => tableUIStore.toggleSidebar('right')}
			aria-label="Show right sidebar"
		>
			<PanelRightClose class="h-4 w-4" />
		</Button>
	{/if}
</div>
