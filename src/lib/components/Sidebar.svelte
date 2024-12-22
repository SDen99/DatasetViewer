<script lang="ts">
  import {ScrollArea} from '$lib/components/ui/scroll-area';
  import { Button } from '$lib/components/ui/button';
  import { PanelLeftOpen, PanelRightOpen } from 'lucide-svelte';
  import { datasetActions } from '$lib/stores/stores';
  
  export let position: 'left' | 'right';
  export let open: boolean;
  export let title: string;
  
  const Icon = position === 'left' ? PanelLeftOpen : PanelRightOpen;
  
  $: borderClass = position === 'right' ? 'border-l' : 'border-r';
</script>

<div class="relative {open ? 'w-80' : 'w-0'} transition-all duration-300 ease-in-out">
  <ScrollArea class="h-[calc(100vh-8rem)] border-border bg-card {borderClass}">
      <div class="p-4">
          <div class="mb-4 flex items-center justify-between">
              <h2 class="text-lg font-semibold">{title}</h2>
              <Button
                  variant="ghost"
                  size="icon"
                  on:click={() => datasetActions.toggleSidebar(position)}
              >
                  <Icon class="h-4 w-4" />
              </Button>
          </div>
          <slot />
      </div>
  </ScrollArea>
</div>