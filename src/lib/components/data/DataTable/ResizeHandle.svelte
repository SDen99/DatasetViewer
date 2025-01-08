<script lang="ts">
	let { onResize } = $props<{
		onResize: (width: number) => void;
	}>();

	let isResizing = $state(false);
	let startX = $state(0);
	let startWidth = $state(0);
	let resizeHandle = $state<HTMLElement | null>(null);

	function handleMouseDown(e: MouseEvent) {
		e.preventDefault();
		e.stopPropagation();

		const handleRect = resizeHandle?.getBoundingClientRect();
		if (!handleRect) return;

		if (e.clientX >= handleRect.left && e.clientX <= handleRect.right) {
			startResizing(e.pageX);
		}
	}

	function startResizing(pageX: number) {
		isResizing = true;
		startX = pageX;

		const headerCell = resizeHandle?.closest('th');
		if (headerCell) {
			startWidth = headerCell.offsetWidth;
		}

		window.addEventListener('mousemove', handleMouseMove);
		window.addEventListener('mouseup', handleMouseUp);
	}

	function handleMouseMove(e: MouseEvent) {
		if (!isResizing) return;

		const diff = e.pageX - startX;
		const clampedDiff = Math.max(-startWidth + 50, diff);
		const newWidth = startWidth + clampedDiff;

		onResize(newWidth);
	}

	function handleMouseUp() {
		isResizing = false;
		window.removeEventListener('mousemove', handleMouseMove);
		window.removeEventListener('mouseup', handleMouseUp);
	}

	function handleKeyDown(e: KeyboardEvent) {
		if (e.key === 'Enter' || e.key === ' ') {
			e.preventDefault();
			const headerCell = resizeHandle?.closest('th');
			if (headerCell) {
				onResize(headerCell.offsetWidth + (e.shiftKey ? -10 : 10));
			}
		}
	}
</script>

<button
	bind:this={resizeHandle}
	type="button"
	class="absolute right-0 top-0 h-full w-4 cursor-col-resize border-none bg-transparent
		   hover:bg-primary/10 focus-visible:outline-none focus-visible:ring-2
		   focus-visible:ring-primary active:bg-primary/20"
	onmousedown={handleMouseDown}
	onkeydown={handleKeyDown}
	aria-label="Resize column"
>
	<div
		class="absolute right-0 top-0 h-full w-0.5 bg-border
			 group-hover/header:bg-primary/50"
	></div>
</button>
