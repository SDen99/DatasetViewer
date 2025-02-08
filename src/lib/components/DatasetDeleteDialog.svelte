<script lang="ts">
	import * as AlertDialog from '$lib/components/core/alert-dialog/index.js';
	import { untrack } from 'svelte';

	const props = $props<{
		open: boolean;
		datasetName: string | null;
		onConfirm: () => void;
		onCancel: () => void;
	}>();

	// Optional: Debug effect for prop changes
	$effect.root(() => {
		$effect(() => {
			$inspect({
				open: props.open,
				datasetName: props.datasetName
			});
		});
	});

	// Handler to ensure state updates don't create unwanted reactions
	function handleConfirm() {
		untrack(() => {
			props.onConfirm();
		});
	}

	function handleCancel() {
		untrack(() => {
			props.onCancel();
		});
	}
</script>

<AlertDialog.Root open={props.open}>
	<AlertDialog.Portal>
		<AlertDialog.Content>
			<AlertDialog.Header>
				<AlertDialog.Title>Delete Dataset</AlertDialog.Title>
				<AlertDialog.Description>
					Are you sure you want to delete {props.datasetName}? This action cannot be undone.
				</AlertDialog.Description>
			</AlertDialog.Header>

			<AlertDialog.Footer>
				<AlertDialog.Cancel onclick={handleCancel}>Cancel</AlertDialog.Cancel>
				<AlertDialog.Action
					class="bg-destructive text-destructive-foreground hover:bg-destructive/90"
					onclick={handleConfirm}
				>
					Delete
				</AlertDialog.Action>
			</AlertDialog.Footer>
		</AlertDialog.Content>
	</AlertDialog.Portal>
</AlertDialog.Root>
