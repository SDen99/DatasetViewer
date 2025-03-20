<script lang="ts">
	import type { Snippet } from 'svelte';
	import Sidebar from '$lib/components/layout/Sidebar.svelte';
	import SidebarToggleButtons from '$lib/components/layout/SidebarToggleButtons.svelte';
	import { uiStore } from '$lib/core/stores/UIStore.svelte';
	import DefineXMLBadges from '$lib/components/data/DefineXMLBadges.svelte';

	let { navigation, leftbar, mainContent, rightbar, footer } = $props<{
		navigation: Snippet;
		leftbar: Snippet;
		mainContent: Snippet;
		rightbar: Snippet;
		footer: Snippet;
	}>();
</script>

{#snippet leftSidebarHeader()}
	<div class="flex items-center justify-between">
		<h2 class="mr-2 text-lg font-semibold">Define(s):</h2>
		<DefineXMLBadges />
	</div>
{/snippet}

{#snippet rightSidebarHeader()}
	<h2 class="text-lg font-semibold">Variables</h2>
{/snippet}

<main class="flex max-h-screen min-h-screen flex-col bg-background">
	{@render navigation()}

	<div class="flex h-[calc(100vh-8rem)] flex-1 overflow-hidden">
		<Sidebar
			position="left"
			open={uiStore.uiState.leftSidebarOpen}
			headerContent={leftSidebarHeader}
			sidebarContent={leftbar}
		/>

		<div class="min-w-0 flex-1 overflow-hidden">
			{@render mainContent()}
		</div>

		<Sidebar
		    position="right"
		    open={uiStore.uiState.rightSidebarOpen && uiStore.uiState.viewMode === 'data'}
		    headerContent={rightSidebarHeader}
		    sidebarContent={rightbar}
	    />
	</div>

	{@render footer()}

	<SidebarToggleButtons />
</main>
