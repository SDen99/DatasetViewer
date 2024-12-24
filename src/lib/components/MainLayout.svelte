<!-- @migration-task Error while migrating Svelte code: This migration would change the name of a slot making the component unusable -->
<script lang="ts">
    import Sidebar from '$lib/components/Sidebar.svelte';
    import SidebarToggleButtons from '$lib/components/SidebarToggleButtons.svelte';
    import { uiState, selectedDataset } from '$lib/stores/stores';
  interface Props {
    navigation?: import('svelte').Snippet;
    leftbar?: import('svelte').Snippet;
    maincontent?: import('svelte').Snippet;
    rightbar?: import('svelte').Snippet;
    footer?: import('svelte').Snippet;
  }

  let {
    navigation,
    leftbar,
    maincontent,
    rightbar,
    footer
  }: Props = $props();
</script>
  
  <main class="flex max-h-screen min-h-screen flex-col bg-background">
    {@render navigation?.()}
    <SidebarToggleButtons />
    
    <div class="flex h-[calc(100vh-8rem)] flex-1 overflow-hidden">
      <Sidebar 
        position="left" 
        open={$uiState.leftSidebarOpen}
        title="Datasets">
        {@render leftbar?.()}
      </Sidebar>
  
      <div class="min-w-0 flex-1 overflow-hidden">
        {@render maincontent?.()}
      </div>
  
      {#if $selectedDataset}
        <Sidebar 
          position="right" 
          open={$uiState.rightSidebarOpen}
          title="Variables">
          {@render rightbar?.()}
        </Sidebar>
      {/if}
    </div>
    
    {@render footer?.()}
  </main>