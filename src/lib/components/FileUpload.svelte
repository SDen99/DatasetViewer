<script lang="ts">
	import { Button } from '$lib/components/core/button';
	import { Upload } from 'svelte-lucide';

	let { handleFileChangeEvent } = $props();
	let fileInput = $state<HTMLInputElement | null>(null);

	function triggerFileInput() {
		fileInput?.click();
	}
</script>

<!-- Hidden file input -->
<input
	bind:this={fileInput}
	type="file"
	accept=".sas7bdat,.xml"
	multiple
	class="hidden"
	onchange={handleFileChangeEvent}
/>

<Button onclick={triggerFileInput} variant="outline" class="gap-2">
	<Upload class="h-4 w-4" />
	Upload Files
</Button>
