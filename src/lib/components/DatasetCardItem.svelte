<script lang="ts">
	import { Database, FileText, Files, Trash2, Loader2, AlertCircle } from 'lucide-svelte';
	import * as Button from '$lib/components/core/button';
	import { Progress } from '$lib/components/core/progress';
	import * as Tooltip from '$lib/components/core/tooltip';

	const props = $props<{
		name: string;
		state: {
			hasData: boolean;
			hasMetadata: boolean;
			isLoading: boolean;
			error?: string;
		};
		isSelected: boolean;
		loadingProgress?: number;
		onDelete: () => void;
		onClick: () => void;
	}>();

	const stateInfo = $derived.by(() => {
		const { state } = props;

		if (state.isLoading) {
			return {
				type: 'loading' as const,
				tooltip: 'Loading Dataset',
				icon: Loader2,
				iconClass: 'text-muted-foreground animate-spin'
			};
		}

		if (state.error) {
			return {
				type: 'error' as const,
				tooltip: state.error,
				icon: AlertCircle,
				iconClass: 'text-destructive'
			};
		}

		if (state.hasData && state.hasMetadata) {
			return {
				type: 'both' as const,
				tooltip: 'Data + Metadata Available',
				icon: Files,
				iconClass: 'text-primary'
			};
		}

		if (state.hasData) {
			return {
				type: 'data' as const,
				tooltip: 'Data Only',
				icon: Database,
				iconClass: 'text-primary'
			};
		}

		return {
			type: 'metadata' as const,
			tooltip: 'Metadata Only',
			icon: FileText,
			iconClass: 'text-muted-foreground'
		};
	});

	const buttonClass = $derived.by(() => {
		const baseClass = 'flex-1 text-left';
		const interactiveClass =
			props.state.hasData || props.state.hasMetadata
				? 'hover:text-primary'
				: 'cursor-not-allowed opacity-70';
		return `${baseClass} ${interactiveClass}`;
	});

	const containerClass = $derived.by(() => {
		return `overflow-hidden rounded-lg border ${
			props.isSelected ? 'border-primary' : 'border-border'
		}`;
	});

	$effect.root(() => {
		$effect(() => {
			$inspect({
				name: props.name,
				state: props.state,
				isSelected: props.isSelected
			});
		});
	});

	const Icon = $derived.by(() => stateInfo.icon);
</script>

<div class={containerClass}>
	<div class="flex items-center justify-between p-3">
		<button
			type="button"
			class={buttonClass}
			onclick={props.onClick}
			disabled={props.state.isLoading}
		>
			<div class="flex items-center gap-2">
				<Tooltip.Provider>
					<Tooltip.Root>
						<Tooltip.Trigger asChild>
							<span class="inline-block">
								<Icon class="h-4 w-4 {stateInfo.iconClass}" />
							</span>
						</Tooltip.Trigger>
						<Tooltip.Content>
							<p>{stateInfo.tooltip}</p>
						</Tooltip.Content>
					</Tooltip.Root>
				</Tooltip.Provider>
				<span class="truncate font-medium">{props.name}</span>
			</div>
		</button>

		{#if props.state.hasData && !props.state.isLoading}
			<Button.Root
				variant="ghost"
				size="icon"
				class="h-8 w-8 text-muted-foreground hover:text-destructive"
				onclick={props.onDelete}
			>
				<Trash2 class="h-4 w-4" />
			</Button.Root>
		{/if}
	</div>

	{#if props.state.isLoading}
		<div class="px-3 pb-3">
			<Progress value={props.loadingProgress ?? 0} />
		</div>
	{/if}
</div>
