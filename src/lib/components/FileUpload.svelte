<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import { Upload } from 'lucide-svelte';

	interface Props {
		handleFileChangeEvent: (event: Event) => void;
	}

	let { handleFileChangeEvent }: Props = $props();

	function triggerFileInput() {
		const input = document.createElement('input');
		input.type = 'file';
		input.accept = '.sas7bdat';
		input.multiple = true;
		input.onchange = handleFileChangeEvent;
		input.click();
	}
</script>

<Button on:click={triggerFileInput} variant="outline" class="gap-2">
	<Upload class="h-4 w-4" />
	Upload Files
</Button>
