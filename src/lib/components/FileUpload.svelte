<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import { Upload } from 'svelte-lucide';

	let { handleFileChangeEvent }: Props = $props();
	let fileInput = $state<HTMLInputElement | null>(null);

	function triggerFileInput() {
		console.log('Trigger clicked');
		fileInput?.click();
	}

	$effect(() => {
		$inspect('FileUpload:', { fileInput, handleFileChangeEvent });
	});
</script>

<!-- Hidden file input -->
<input
	bind:this={fileInput}
	type="file"
	accept=".sas7bdat"
	multiple
	class="hidden"
	onchange={handleFileChangeEvent}
/>

<Button onclick={triggerFileInput} variant="outline" class="gap-2">
	<Upload class="h-4 w-4" />
	Upload Files
</Button>
