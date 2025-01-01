<script lang="ts">
	import DragHandle from './DragHandle.svelte';
	import ResizeHandle from './ResizeHandle.svelte';
	import SortButton from './SortButton.svelte';
	import type { sortConfigs } from '../types';

	let {
		column,
		sorts,
		onSort,
		onResizeStart,
		onKeyResize,
		isDraggable = true
	} = $props<{
		column: string;
		sorts: sortConfigs;
		onSort: () => void;
		onResizeStart: (e: MouseEvent) => void;
		onKeyResize: (e: KeyboardEvent) => void;
		isDraggable?: boolean;
	}>();
</script>

<div class="flex h-full select-none items-center gap-2">
	<DragHandle disabled={!isDraggable} />

	<SortButton {column} {sort} {onSort} />

	<ResizeHandle {onResizeStart} {onKeyResize} />
</div>
