<script lang="ts">
	import { X } from 'lucide-svelte';
	import * as AlertDialog from '$lib/components/core/alert-dialog/index.js';
	import * as Button from '$lib/components/core/button';
	import * as Tooltip from '$lib/components/core/tooltip';
	import { Badge } from '$lib/components/core/badge';
	import { storeCoordinator } from '$lib/core/stores/storeCoordinator.svelte';
	import { datasetStore } from '$lib/core/stores/datasetStore.svelte';
	import { uiStore } from '$lib/core/stores/UIStore.svelte';

	// State for delete confirmation
	let dialogOpen = $state(false);
	let defineTypeToDelete = $state<'SDTM' | 'ADaM' | null>(null);

	// Derived state for Define.xml presence
	let hasSDTM = $derived(Boolean(datasetStore.defineXmlDatasets.SDTM));
	let hasADaM = $derived(Boolean(datasetStore.defineXmlDatasets.ADaM));

	// Add an inspection effect to monitor badge status
	$effect(() => {
		$inspect({
			event: 'DefineXMLBadges status',
			hasSDTM,
			hasADaM,
			SDTMdataset: datasetStore.defineXmlDatasets.SDTM ? 'present' : 'null',
			ADaMdataset: datasetStore.defineXmlDatasets.ADaM ? 'present' : 'null'
		});
	});

	function handleConfirmDelete() {
		if (defineTypeToDelete) {
			const defineFiles = datasetStore.defineXmlDatasets;
			// Find the actual file entry in datasetStore
			const actualFileName = Object.entries(datasetStore.datasets).find(([_, dataset]) => {
				if (
					typeof dataset.data === 'object' &&
					dataset.data !== null &&
					'MetaData' in dataset.data &&
					dataset.data.MetaData &&
					typeof dataset.data.MetaData === 'object' &&
					dataset.data.MetaData !== null &&
					'OID' in dataset.data.MetaData &&
					defineTypeToDelete &&
					defineFiles[defineTypeToDelete] &&
					typeof defineFiles[defineTypeToDelete] === 'object' &&
					defineFiles[defineTypeToDelete] !== null
				) {
					return true;
				}
				return false;
			})?.[0];

			if (actualFileName) {
				datasetStore
					.removeDefineAssociations(actualFileName)
					.then(() => {
						console.log('🟢 DefineXMLBadges: Associations removed');
						return datasetStore.deleteDataset(actualFileName);
					})
					.then(() => {
						console.log('🟢 DefineXMLBadges: Dataset deleted');

						// Update UI state with explicit boolean values
						const newSDTMState = defineTypeToDelete === 'SDTM' ? false : Boolean(hasSDTM);
						const newADaMState = defineTypeToDelete === 'ADaM' ? false : Boolean(hasADaM);

						console.log('🟢 DefineXMLBadges: Updating UI state:', {
							newSDTMState,
							newADaMState
						});

						storeCoordinator.updateDefineXMLStatus(newSDTMState, newADaMState);
					})
					.catch((error) => {
						console.error('🔴 DefineXMLBadges: Error during deletion:', error);
					});
			}
		}

		defineTypeToDelete = null;
		dialogOpen = false;
	}
	function handleDeleteClick(type: 'SDTM' | 'ADaM') {
		defineTypeToDelete = type;
		dialogOpen = true;
	}

	function handleCancelDelete() {
		defineTypeToDelete = null;
		dialogOpen = false;
	}
</script>

<div class="flex items-center gap-2">
	{#if hasSDTM}
		<Tooltip.Provider>
			<Tooltip.Root>
				<Tooltip.Trigger>
					<div class="flex items-center gap-1">
						<Badge variant="secondary" class="cursor-default">
							SDTM
							<button
								class="ml-1 rounded-full hover:bg-destructive/20"
								onclick={() => handleDeleteClick('SDTM')}
							>
								<X class="h-3 w-3" />
							</button>
						</Badge>
					</div>
				</Tooltip.Trigger>
				<Tooltip.Content>
					<p>SDTM Define.xml loaded</p>
				</Tooltip.Content>
			</Tooltip.Root>
		</Tooltip.Provider>
	{/if}

	{#if hasADaM}
		<Tooltip.Provider>
			<Tooltip.Root>
				<Tooltip.Trigger>
					<div class="flex items-center gap-1">
						<Badge variant="secondary" class="cursor-default">
							ADaM
							<button
								class="ml-1 rounded-full hover:bg-destructive/20"
								onclick={() => handleDeleteClick('ADaM')}
							>
								<X class="h-3 w-3" />
							</button>
						</Badge>
					</div>
				</Tooltip.Trigger>
				<Tooltip.Content>
					<p>ADaM Define.xml loaded</p>
				</Tooltip.Content>
			</Tooltip.Root>
		</Tooltip.Provider>
	{/if}
</div>

<AlertDialog.Root bind:open={dialogOpen}>
	<AlertDialog.Portal>
		<AlertDialog.Content>
			<AlertDialog.Header>
				<AlertDialog.Title>Delete Define.xml</AlertDialog.Title>
				<AlertDialog.Description>
					Are you sure you want to delete the {defineTypeToDelete} Define.xml? This will remove all associated
					metadata.
				</AlertDialog.Description>
			</AlertDialog.Header>

			<AlertDialog.Footer>
				<AlertDialog.Cancel onclick={handleCancelDelete}>Cancel</AlertDialog.Cancel>
				<AlertDialog.Action
					class="bg-destructive text-destructive-foreground hover:bg-destructive/90"
					onclick={handleConfirmDelete}
				>
					Delete
				</AlertDialog.Action>
			</AlertDialog.Footer>
		</AlertDialog.Content>
	</AlertDialog.Portal>
</AlertDialog.Root>
