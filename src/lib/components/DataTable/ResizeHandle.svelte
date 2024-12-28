<script lang="ts">
	let { onResize } = $props<{
		onResize: (width: number) => void;
	}>();

	let isResizing = $state(false);
	let startX = $state(0);
	let startWidth = $state(0);

	function handleMouseDown(e: MouseEvent) {
		e.preventDefault();
		e.stopPropagation();
		startResizing(e.pageX);
	}

	function handleKeyDown(e: KeyboardEvent) {
		if (e.key === 'Enter' || e.key === ' ') {
			e.preventDefault();
			const headerCell = (e.target as HTMLElement).closest('th');
			if (headerCell) {
				// Resize by 10px on keyboard interaction
				onResize(headerCell.offsetWidth + (e.shiftKey ? -10 : 10));
			}
		}
	}

	function startResizing(pageX: number) {
		isResizing = true;
		startX = pageX;

		const headerCell = document.activeElement?.closest('th');
		if (headerCell) {
			startWidth = headerCell.offsetWidth;
		}

		window.addEventListener('mousemove', handleMouseMove);
		window.addEventListener('mouseup', handleMouseUp);
	}

	function handleMouseMove(e: MouseEvent) {
		if (!isResizing) return;

		const diff = e.pageX - startX;
		const newWidth = Math.max(50, startWidth + diff);
		onResize(newWidth);
	}

	function handleMouseUp() {
		isResizing = false;
		window.removeEventListener('mousemove', handleMouseMove);
		window.removeEventListener('mouseup', handleMouseUp);
	}
</script>

<div
	class="absolute right-0 top-0 h-full w-4 cursor-col-resize
         hover:bg-primary/10 active:bg-primary/20"
	onmousedown={handleMouseDown}
	onkeydown={handleKeyDown}
	role="separator"
	aria-orientation="vertical"
>
	<div
		class="absolute right-0 top-0 h-full w-0.5 bg-border
              group-hover/header:bg-primary/50"
	></div>
</div>
