<script lang="ts">
	import type { Snippet } from 'svelte';
	import Sidebar from '$lib/components/layout/Sidebar.svelte';
	import SidebarToggleButtons from '$lib/components/layout/SidebarToggleButtons.svelte';
	import { uiStore } from '$lib/core/stores/UIStore.svelte';

	let { navigation, leftbar, mainContent, rightbar, footer } = $props<{
		navigation: Snippet;
		leftbar: Snippet;
		mainContent: Snippet;
		rightbar: Snippet;
		footer: Snippet;
	}>();
</script>

<main class="flex max-h-screen min-h-screen flex-col bg-background">
	{@render navigation()}

	<div class="flex h-[calc(100vh-8rem)] flex-1 overflow-hidden">
		<Sidebar position="left" open={uiStore.uiState.leftSidebarOpen} title="Datasets">
			{@render leftbar()}
		</Sidebar>

		<div class="min-w-0 flex-1 overflow-hidden">
			{@render mainContent()}
		</div>

		<Sidebar position="right" open={uiStore.uiState.rightSidebarOpen} title="Variables">
			{@render rightbar()}
		</Sidebar>
	</div>

	{@render footer()}

	<SidebarToggleButtons />
</main>
