<script lang="ts">
	import { GripVertical } from 'lucide-svelte';

	let { disabled = false } = $props<{
		disabled?: boolean;
	}>();
</script>

<div
	class="cursor-move rounded p-1 transition-colors hover:bg-muted
				 {disabled ? 'cursor-not-allowed opacity-50' : ''}"
	role="button"
	aria-label="Drag to reorder column"
	tabindex={disabled ? -1 : 0}
>
	<GripVertical class="h-4 w-4 text-muted-foreground" />
</div>
