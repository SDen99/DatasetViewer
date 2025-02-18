<script lang="ts">
	import type { itemDef } from '$lib/core/processors/defineXML/types';
	import { Badge } from '$lib/components/core/badge';

	let {
		variable,
		displayMode = 'full', // 'full' | 'table-row' | 'card'
		hasVLM = false,
		orderNumber,
		keySequence,
		columnStyles = {}
	} = $props<{
		variable: itemDef;
		displayMode?: string;
		hasVLM?: boolean;
		orderNumber?: string;
		keySequence?: string;
		columnStyles?: Record<string, string>;
	}>();

	const ORIGIN_ABBREV: Record<string, string> = {
		Collected: 'CRF',
		Derived: 'DER',
		Assigned: 'ASG',
		Protocol: 'PRT',
		Predecessor: 'PRE'
	};

	function getOriginAbbrev(originType: string | undefined): string {
		if (!originType) return '-';
		return ORIGIN_ABBREV[originType] || originType;
	}

	$effect(() => {
		console.log('VariableDetails props:', {
			variable,
			displayMode,
			orderNumber,
			hasVLM,
			keySequence
		});
	});
</script>

{#if displayMode === 'table-row'}
	<div class="flex items-center gap-1">
		<span class="font-mono">
			{variable.Name || variable.OID?.split('.')[2] || '-'}
		</span>
		{#if variable.hasVLM}
			<Badge variant="secondary" class="px-1 py-0">VLM</Badge>
		{/if}
		{#if variable.KeySequence}
			<Badge variant="outline" class="px-1 py-0">K{variable.KeySequence}</Badge>
		{/if}
	</div>
{:else}
	<!-- Original card/full display mode -->
	<div class="flex flex-col gap-2">
		<div class="flex items-center gap-2">
			<span class="font-mono">
				{variable.Name || '-'}
			</span>
			<div class="flex gap-1">
				{#if variable.KeySequence}
					<Badge variant="outline" class="px-1 py-0">K{variable.KeySequence}</Badge>
				{/if}
				{#if variable.hasVLM}
					<Badge variant="secondary" class="px-1 py-0">VLM</Badge>
				{/if}
			</div>
		</div>

		<p class="text-sm text-muted-foreground">
			{variable.Description || '-'}
		</p>

		<div class="flex gap-4">
			<div class="space-y-1">
				<div class="text-sm">
					<span class="text-muted-foreground">Type:</span>
					<span class="ml-1 font-medium">{variable.DataType || '-'}</span>
				</div>
				<div class="text-sm">
					<span class="text-muted-foreground">Length:</span>
					<span class="ml-1 font-medium">{variable.Length || '-'}</span>
				</div>
				{#if variable.Format}
					<div class="text-sm">
						<span class="text-muted-foreground">Format:</span>
						<span class="ml-1 font-mono">{variable.Format}</span>
					</div>
				{/if}
			</div>

			<div class="space-y-1">
				{#if variable.Mandatory}
					<Badge variant={variable.Mandatory === 'Yes' ? 'default' : 'secondary'} class="px-1 py-0">
						{variable.Mandatory === 'Yes' ? 'Required' : 'Optional'}
					</Badge>
				{/if}
				{#if variable.OriginType}
					<Badge variant="outline" class="px-1 py-0">
						{getOriginAbbrev(variable.OriginType)}
					</Badge>
				{/if}
			</div>
		</div>
	</div>
{/if}
