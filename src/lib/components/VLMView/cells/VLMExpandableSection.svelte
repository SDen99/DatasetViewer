<script lang="ts">
	let { 
		title,
		sectionId
	} = $props<{
		title: string;
		sectionId: string;
	}>();

	let isCollapsed = $state(true);

	function toggleSection() {
		isCollapsed = !isCollapsed;
	}
</script>

<div class="mb-2">
	<button
		type="button"
		class="mb-1 flex w-fit cursor-pointer items-center gap-1 rounded-sm bg-primary/20 px-2 py-1 text-foreground"
		onclick={toggleSection}
		onkeydown={(e) => e.key === 'Enter' && toggleSection()}
		aria-expanded={!isCollapsed}
	>
		<svg
			class="h-3 w-3" 
			viewBox="0 0 24 24"
			fill="none"
			stroke="currentColor"
			stroke-width="2" 
		>
			<path
				d={isCollapsed
					? 'M9 5l7 7-7 7'
					: 'M19 9l-7 7-7-7'}
			></path>
		</svg>
		<span class="text-xs font-medium">{title}</span>
	</button>
	<div class={isCollapsed ? 'hidden' : 'pl-2'}>
		<slot></slot>
	</div>
</div>