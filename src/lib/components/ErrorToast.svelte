<script lang="ts" context="module">
  export interface ToastProps {
    position?: 'top-right' | 'bottom-right' | 'top-left' | 'bottom-left';
  }
</script>

<script lang="ts">
  import { fly } from 'svelte/transition';
  import { errorStore, type AppError } from '../stores/errorStore';
  import { Button } from '$lib/components/ui/button';

  function getColorClass(severity: string): string {
    switch (severity) {
      case 'critical':
      case 'error':
        return 'border-destructive bg-destructive/10 text-destructive';
      case 'warning':
        return 'border-yellow-500 bg-yellow-500/10 text-yellow-700';
      case 'info':
        return 'border-blue-500 bg-blue-500/10 text-blue-700';
      default:
        return 'border-border';
    }
  }

  function getSeverityIcon(severity: string): string {
    switch (severity) {
      case 'critical':
      case 'error':
        return `<svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="8" x2="12" y2="12" />
          <line x1="12" y1="16" x2="12" y2="16" />
        </svg>`;
      case 'warning':
        return `<svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
          <line x1="12" y1="9" x2="12" y2="13" />
          <line x1="12" y1="17" x2="12" y2="17" />
        </svg>`;
      case 'info':
        return `<svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="16" x2="12" y2="12" />
          <line x1="12" y1="8" x2="12" y2="8" />
        </svg>`;
      default:
        return '';
    }
  }
</script>

<div class="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-md">
  {#each $errorStore.errors as error (error.id)}
    <div 
      transition:fly={{ y: 50, duration: 200 }}
      class="relative rounded-lg border p-4 {getColorClass(error.severity)}"
      role="alert"
    >
      <div class="flex gap-3">
        {@html getSeverityIcon(error.severity)}
        <div class="flex-1">
          <div class="mb-1 font-medium leading-none">
            {error.severity.charAt(0).toUpperCase() + error.severity.slice(1)}
          </div>
          <div class="text-sm mt-1">
            {error.message}
          </div>
          {#if error.retry}
            <div class="mt-2">
              <Button 
                variant="outline" 
                size="sm" 
                on:click={error.retry}
                class="h-8"
              >
                Retry
              </Button>
            </div>
          {/if}
        </div>
        <button 
          class="absolute right-2 top-2 opacity-70 ring-offset-background transition-opacity hover:opacity-100"
          on:click={() => errorStore.removeError(error.id)}
          aria-label="Close"
        >
          <svg
            class="h-4 w-4"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
          >
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      </div>
    </div>
  {/each}
</div>