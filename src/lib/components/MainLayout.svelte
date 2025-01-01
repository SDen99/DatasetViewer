<script lang="ts">
	import type { Snippet } from 'svelte';
	import Sidebar from '$lib/components/Sidebar.svelte';
	import SidebarToggleButtons from '$lib/components/SidebarToggleButtons.svelte';
	import { dataTableStore } from '$lib/stores/dataTableStore.svelte';

	let { navigation, leftbar, mainContent, rightbar, footer } = $props<{
		navigation: Snippet;
		leftbar: Snippet;
		mainContent: Snippet;
		rightbar: Snippet;
		footer: Snippet;
	}>();

	$effect(() => {
		$inspect({
			'Navigation snippet exists': !!navigation,
			'leftbar snippet exists': !!leftbar,
			'Test snippet exists': !!mainContent,
			'rightbar snippet exists': !!rightbar,
			'footer snippet exists': !!footer
		});
	});
</script>

<main class="flex max-h-screen min-h-screen flex-col bg-background">
	{@render navigation()}

	<div class="flex h-[calc(100vh-8rem)] flex-1 overflow-hidden">
		<Sidebar position="left" open={dataTableStore.uiState.leftSidebarOpen} title="Datasets">
			{@render leftbar()}
		</Sidebar>

		<div class="min-w-0 flex-1 overflow-hidden">
			{@render mainContent()}
		</div>

		{#if dataTableStore.selectedDataset}
			<Sidebar position="right" open={dataTableStore.uiState.rightSidebarOpen} title="Variables">
				{@render rightbar()}
			</Sidebar>
		{/if}
	</div>

	{@render footer()}

	<SidebarToggleButtons />
</main>
