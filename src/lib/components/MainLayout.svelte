<script lang="ts">
    import Sidebar from '$lib/components/Sidebar.svelte';
    import SidebarToggleButtons from '$lib/components/SidebarToggleButtons.svelte';
    import { uiState, selectedDataset } from '$lib/stores/stores';
</script>
  
  <main class="flex max-h-screen min-h-screen flex-col bg-background">
    <slot name="navigation" />
    <SidebarToggleButtons />
    
    <div class="flex h-[calc(100vh-8rem)] flex-1 overflow-hidden">
      <Sidebar 
        position="left" 
        open={$uiState.leftSidebarOpen}
        title="Datasets">
        <slot name="left-sidebar" />
      </Sidebar>
  
      <div class="min-w-0 flex-1 overflow-hidden">
        <slot name="main-content" />
      </div>
  
      {#if $selectedDataset}
        <Sidebar 
          position="right" 
          open={$uiState.rightSidebarOpen}
          title="Variables">
          <slot name="right-sidebar" />
        </Sidebar>
      {/if}
    </div>
    
    <slot name="footer" />
  </main>