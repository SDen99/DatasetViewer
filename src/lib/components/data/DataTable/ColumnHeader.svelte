<script lang="ts">
	import DragHandle from '$lib/components/data/DataTable/DragHandle.svelte';
	import ResizeHandle from '$lib/components/data/DataTable/ResizeHandle.svelte';
	import SortButton from '$lib/components/data/DataTable/SortButton.svelte';
	import { sortStore } from '$lib/core/stores/sortStore.svelte';

	let { column, onDragStart, onDragOver, onDrop, onResize } = $props<{
		column: string;
		onDragStart: (e: DragEvent) => void;
		onDragOver: (e: DragEvent) => void;
		onDrop: (e: DragEvent) => void;
		onResize: (width: number) => void;
	}>();

	function handleDragStart(e: DragEvent) {
		if ((e.target as HTMLElement).closest('[role="separator"]')) {
			e.preventDefault();
			return;
		}
		onDragStart(e);
	}
</script>

<div
	class="group/header flex h-full select-none items-center gap-2 px-2"
	draggable={true}
	role="button"
	tabindex="0"
	ondragstart={handleDragStart}
	ondragover={onDragOver}
	ondrop={onDrop}
>
	<div class="drag-handle flex-none">
		<DragHandle />
	</div>

	<div class="flex-1">
		<SortButton {column} sorts={sortStore.sort} />
	</div>

	<ResizeHandle {onResize} />
</div>
