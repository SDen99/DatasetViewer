<script lang="ts">
	import DragHandle from './DragHandle.svelte';
	import ResizeHandle from './ResizeHandle.svelte';
	import SortButton from './SortButton.svelte';
	import type { SortConfig } from '$lib/types';

	let {
		column,
		sorts,
		onSort,
		onResize,
		isDraggable = true
	} = $props<{
		column: string;
		sorts: SortConfig[];
		onSort: () => void;
		onResize: (width: number) => void;
		isDraggable?: boolean;
	}>();
</script>

<div class="flex h-full select-none items-center gap-2">
	<DragHandle disabled={!isDraggable} />
	<SortButton {column} {sorts} />
	<ResizeHandle {onResize} />
</div>
