<script lang="ts">
	import DragHandle from '$lib/components/DataTable/DragHandle.svelte';
	import ResizeHandle from '$lib/components/DataTable/ResizeHandle.svelte';
	import SortButton from '$lib/components/DataTable/SortButton.svelte';

	let { column, sort, onSort, onDragStart, onDragOver, onDrop, onResize } = $props<{
		column: string;
		sort: { column: string | null; direction: 'asc' | 'desc' | null };
		onSort: () => void;
		onDragStart: (e: DragEvent) => void;
		onDragOver: (e: DragEvent) => void;
		onDrop: (e: DragEvent) => void;
		onResize: (width: number) => void;
	}>();

	function handleDragStart(e: DragEvent) {
		onDragStart(e);
	}
</script>

<div
	class="flex h-full select-none items-center gap-2"
	draggable={true}
	role="button"
	tabindex="0"
	ondragstart={handleDragStart}
	ondragover={onDragOver}
	ondrop={onDrop}
>
	<div class="drag-handle">
		<DragHandle />
	</div>
	<SortButton {column} {sort} {onSort} />
	<ResizeHandle {onResize} />
</div>
