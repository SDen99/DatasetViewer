<script lang="ts">
	import { Database, FileText, Files, Trash2, Loader2, AlertCircle, ChevronDown } from 'lucide-svelte';
	import * as Button from '$lib/components/core/button';
	import { Progress } from '$lib/components/core/progress';
	import * as Tooltip from '$lib/components/core/tooltip';
	import { Badge } from '$lib/components/core/badge';

	const props = $props<{
	name: string;
	description?: string;
	class?: string;
	// New metadata fields
	isReferenceData?: string;
	purpose?: string;
	repeating?: string;
	structure?: string;
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

	const containerClass = $derived.by(() => {
		const baseClasses = 'overflow-hidden rounded-lg';
		const selectedClasses = props.isSelected
			? 'border-2 border-primary bg-primary/5'
			: 'border-border hover:border-primary/50';

		return `${baseClasses} ${selectedClasses}`;
	});

	const getClassAbbreviation = (classType: string | undefined) => {
		if (!classType) return '';

		const abbreviations: Record<string, string> = {
			'BASIC DATA STRUCTURE': 'BDS',
			'OCCURRENCE DATA STRUCTURE': 'OCCUR',
			'SUBJECT LEVEL ANALYSIS DATASET': 'SLAD'
		};

		return abbreviations[classType.toUpperCase()] || classType;
	};

	const isClickable = $derived.by(() => {
		return props.state.hasData || props.state.hasMetadata;
	});

	const handleClick = (event: MouseEvent) => {
		// Prevent click if clicking the delete button or expand button
		const target = event.target as HTMLElement;
		if (target.closest('button[data-delete-button]') || target.closest('button[data-expand-button]')) {
			return;
		}

		if (isClickable && !props.state.isLoading) {
			props.onClick();
		}
	};

	const Icon = $derived.by(() => stateInfo.icon);

	// Determine if additional metadata is available to show the dropdown button
	const hasAdditionalMetadata = $derived.by(() => {
		return props.isReferenceData || props.purpose || props.repeating || props.structure;
	});

	let isExpanded = $state(false);

    const toggleExpand = (event: MouseEvent) => {
        event.stopPropagation(); // Prevent triggering the main card click
        isExpanded = !isExpanded;
    };
    
    // Dynamic tooltip text based on expanded state
    const tooltipText = $derived.by(() => isExpanded ? "Fewer details" : "More details");
</script>

<button
	type="button"
	class="{containerClass} w-full text-left {!isClickable ? 'cursor-not-allowed opacity-70' : ''}"
	onclick={handleClick}
	disabled={!isClickable || props.state.isLoading}
	aria-label="Select dataset {props.name}"
>
	<div class="flex flex-col border p-3">
		<!-- Main Content -->
		<div class="flex items-center justify-between">
			<div class="flex flex-1 items-center gap-2">
				<Tooltip.Provider>
					<Tooltip.Root>
						<Tooltip.Trigger>
							<span class="inline-block">
								<Icon class="h-4 w-4 {stateInfo.iconClass}" />
							</span>
						</Tooltip.Trigger>
						<Tooltip.Content>
							<p>{stateInfo.tooltip}</p>
						</Tooltip.Content>
					</Tooltip.Root>
				</Tooltip.Provider>
				<span class="truncate text-base font-medium">{props.name}</span>
			</div>

			<!-- Actions Section -->
			<div class="flex items-center gap-2">
				{#if props.class}
					<Tooltip.Provider>
						<Tooltip.Root>
							<Tooltip.Trigger>
								<div>
									<Badge variant="outline" class="text-xs font-medium">
										{getClassAbbreviation(props.class)}
									</Badge>
								</div>
							</Tooltip.Trigger>
							<Tooltip.Content>
								<p>{props.class}</p>
							</Tooltip.Content>
						</Tooltip.Root>
					</Tooltip.Provider>
				{/if}

				{#if props.state.hasData && !props.state.isLoading}
					<Button.Root
						variant="ghost"
						size="icon"
						class="h-8 w-8 text-muted-foreground hover:text-destructive"
						onclick={(e) => {
							e.stopPropagation();
							props.onDelete();
						}}
						data-delete-button
						aria-label="Delete dataset"
					>
						<Trash2 class="h-4 w-4" />
					</Button.Root>
				{/if}
			</div>
		</div>

		<!-- Description and Dropdown Button -->
		<div class="mt-1.5 flex items-start justify-between">
			{#if props.description}
				<p class="line-clamp-2 text-sm text-muted-foreground flex-1">{props.description}</p>
			{:else}
				<div class="flex-1"></div>
			{/if}
			
			<!-- Always show the dropdown button if we have additional metadata -->
			{#if hasAdditionalMetadata && !props.state.isLoading}
				<Tooltip.Provider>
					<Tooltip.Root>
						<Tooltip.Trigger>
							<Button.Root
								variant="ghost"
								size="icon"
								class="h-6 w-6 ml-2 flex-shrink-0 text-muted-foreground"
								onclick={toggleExpand}
								data-expand-button
								aria-label={isExpanded ? "Hide details" : "Show more details"}
							>
								<ChevronDown 
									class="h-4 w-4 transition-transform duration-200 {isExpanded ? 'rotate-180' : ''}" 
								/>
							</Button.Root>
						</Tooltip.Trigger>
						<Tooltip.Content>
							<p>{tooltipText}</p>
						</Tooltip.Content>
					</Tooltip.Root>
				</Tooltip.Provider>
			{/if}
		</div>
		
		<!-- Expanded Metadata Section -->
		{#if isExpanded}
			<div class="mt-3 border-t pt-3 grid grid-cols-2 gap-2 text-sm text-muted-foreground animate-in fade-in-50 duration-200">
				{#if props.isReferenceData}
					<div>
						<span class="font-medium text-foreground">Reference Data:</span> {props.isReferenceData}
					</div>
				{/if}
				
				{#if props.purpose}
					<div>
						<span class="font-medium text-foreground">Purpose:</span> {props.purpose}
					</div>
				{/if}
				
				{#if props.repeating}
					<div>
						<span class="font-medium text-foreground">Repeating:</span> {props.repeating}
					</div>
				{/if}
				
				{#if props.structure}
					<div class="col-span-2">
						<span class="font-medium text-foreground">Structure:</span> {props.structure}
					</div>
				{/if}
			</div>
		{/if}
	</div>

	{#if props.state.isLoading}
		<div class="px-3 pb-3">
			<Progress value={props.loadingProgress ?? 0} />
		</div>
	{/if}
</button>