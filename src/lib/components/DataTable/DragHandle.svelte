<script lang="ts">
	import { GripVertical } from 'svelte-lucide';

	let { disabled = false } = $props<{
		disabled?: boolean;
	}>();
</script>

<div
	class="cursor-move rounded p-1.5 transition-colors
         hover:bg-muted/80 active:bg-muted
         {disabled ? 'cursor-not-allowed opacity-50' : ''}"
	role="button"
	aria-label="Drag to reorder column"
	tabindex={disabled ? -1 : 0}
>
	<GripVertical class="h-4 w-4 text-muted-foreground" />
</div>
