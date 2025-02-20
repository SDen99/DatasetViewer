<script lang="ts">
	import type {
		ParsedDefineXML,
		method,
		comment,
		CodeList,
		itemRef
	} from '$lib/core/processors/defineXML/types';
	import {
		Table,
		TableBody,
		TableCell,
		TableHead,
		TableHeader,
		TableRow
	} from '$lib/components/core/table';
	import { Badge } from '$lib/components/core/badge';
	import MethodCell from '$lib/components/data/MethodCell.svelte';
	import { metadataViewStore } from '$lib/core/stores/MetadataViewStore.svelte';
	import {
		toggleMethodExpansion,
		toggleCodelistExpansion,
		isMethodExpanded,
		isCodelistExpanded,
		isAnyExpansionActive
	} from '../shared/methodExpansionUtils';
	import { getCodeList, hasCodelist } from '../shared/codelistUtils';
	import { ChevronDown, ChevronRight } from 'lucide-svelte';

	let { define, datasetName, filteredVariables, methods, comments, codeLists } = $props<{
		define: ParsedDefineXML;
		datasetName: string;
		filteredVariables: itemRef[];
		methods: method[];
		comments: comment[];
		codeLists: CodeList[];
	}>();

	// Use Svelte 5's reactive state for the expanded methods
	let expandedMethodsSet = $state(new Set<string>());

	// Update the set whenever the store changes
	$effect(() => {
		const state = metadataViewStore.getDatasetState(datasetName);
		expandedMethodsSet = new Set(
			state.expandedMethods instanceof Set
				? Array.from(state.expandedMethods)
				: Array.isArray(state.expandedMethods)
					? state.expandedMethods
					: []
		);
	});

	// Add store state debugging
	$effect(() => {
		const state = metadataViewStore.getDatasetState(datasetName);
		console.log('Store state update:', {
			datasetName,
			storeExpanded: Array.from(state.expandedMethods),
			localExpanded: Array.from(expandedMethodsSet)
		});
	});

	// Helper functions that use the local state
	function isVariableMethodExpanded(variable: itemRef): boolean {
		return variable.MethodOID && variable.OID
			? expandedMethodsSet.has(`${variable.OID}-${variable.MethodOID}`)
			: false;
	}

	function isVariableCodelistExpanded(variable: itemRef): boolean {
		return variable.OID ? expandedMethodsSet.has(`${variable.OID}-codelist`) : false;
	}

	function isVariableExpanded(variable: itemRef): boolean {
		return isAnyExpansionActive(variable, datasetName, expandedMethodsSet);
	}

	function handleMethodToggle(variable: itemRef) {
		console.log('Method toggle clicked:', {
			variable: variable.OID,
			methodOID: variable.MethodOID,
			currentlyExpanded: isVariableMethodExpanded(variable)
		});
		toggleMethodExpansion(variable, datasetName);
	}

	function handleCodelistToggle(variable: itemRef) {
		console.log('Codelist toggle clicked:', {
			variable: variable.OID,
			hasCodelist: hasCodelist(variable, codeLists),
			currentlyExpanded: isVariableCodelistExpanded(variable)
		});
		toggleCodelistExpansion(variable, datasetName);
	}
</script>

<div class="flex h-full flex-col rounded-lg border">
	<Table>
		<TableHeader class="sticky top-0 bg-white">
			<TableRow class="bg-muted/50">
				<TableHead style="min-width: 160px; width: 160px">Order</TableHead>
				<TableHead style="min-width: 128px; width: 128px">Name</TableHead>
				<TableHead>Label</TableHead>
				<TableHead style="min-width: 80px; width: 80px">Type</TableHead>
				<TableHead style="min-width: 80px; width: 80px">Length</TableHead>
				<TableHead style="min-width: 80px; width: 80px">Format</TableHead>
				<TableHead style="min-width: 64px; width: 64px">Req</TableHead>
				<TableHead style="min-width: 64px; width: 64px">Orig</TableHead>
				<TableHead style="min-width: 192px; width: 192px">Origin/Method</TableHead>
			</TableRow>
		</TableHeader>

		<TableBody class="overflow-y-auto">
			{#each filteredVariables || [] as variable, idx (variable.OID)}
				{@const hasMethod = Boolean(variable.MethodOID)}
				{@const hasList = hasCodelist(variable, codeLists)}

				<!--		{#if hasList || hasMethod}
					{@const debugging = console.log('Variable check:', {
						variableOID: variable.OID,
						methodOID: variable.MethodOID,
						hasCodelist: hasList,
						codeListOID: variable.itemDef?.CodeListOID,
						isMethodExpanded: isVariableMethodExpanded(variable),
						isCodelistExpanded: isVariableCodelistExpanded(variable)
					})}
				{/if} -->
				<!-- Regular row with variable data -->
				<TableRow>
					<TableCell style="min-width: 160px; width: 160px" class="font-mono text-sm">
						<div class="flex items-center gap-2">
							<span>{variable.OrderNumber}</span>
							{#if variable.KeySequence}
								<Badge variant="outline" class="px-1 py-0">K{variable.KeySequence}</Badge>
							{/if}
						</div>
					</TableCell>

					<TableCell style="min-width: 128px; width: 128px">
						<div class="flex items-center gap-1">
							<span class="font-mono">
								{variable.itemDef?.Name || variable.OID?.split('.')[2] || ''}
							</span>
							{#if hasCodelist(variable, codeLists)}
								<Badge variant="secondary" class="px-1 py-0">CL</Badge>
							{/if}
							{#if variable.hasVLM}
								<Badge variant="secondary" class="px-1 py-0">VLM</Badge>
							{/if}
						</div>
					</TableCell>

					<TableCell>
						{variable.itemDef?.Description || '-'}
					</TableCell>

					<TableCell style="min-width: 80px; width: 80px" class="text-sm">
						{variable.itemDef?.DataType || '-'}
					</TableCell>

					<TableCell style="min-width: 80px; width: 80px" class="text-sm">
						{variable.itemDef?.Length || '-'}
					</TableCell>

					<TableCell style="min-width: 80px; width: 80px" class="font-mono text-sm">
						{variable.itemDef?.Format || '-'}
					</TableCell>

					<TableCell style="min-width: 64px; width: 64px">
						<Badge
							variant={variable.Mandatory === 'Yes' ? 'default' : 'secondary'}
							class="px-1 py-0"
						>
							{variable.Mandatory === 'Yes' ? 'Y' : 'N'}
						</Badge>
					</TableCell>

					<TableCell style="min-width: 64px; width: 64px">
						{#if variable.itemDef?.OriginType}
							<Badge variant="outline" class="px-1 py-0">
								{variable.itemDef.OriginType}
							</Badge>
						{:else}
							-
						{/if}
					</TableCell>

					<TableCell style="min-width: 192px; width: 192px">
						{@const hasMethod = Boolean(variable.MethodOID)}
						{@const hasList = hasCodelist(variable, codeLists)}
						{@const hasOrigin = Boolean(variable.itemDef?.Origin)}
						{@const originType = variable.itemDef?.OriginType}

						<div class="flex items-center gap-2">
							<!-- Origin Type Badge -->
							<!--	{#if originType}
								<Badge
									variant={originType === 'Derived' ? 'default' : 'outline'}
									class="shrink-0 px-1.5 py-0"
								>
									{originType}
								</Badge>
							{/if}-->

							<!-- Expandable Content -->
							{#if hasMethod || hasList}
								<div
									class="flex cursor-pointer items-center gap-2"
									role="button"
									tabindex="0"
									onclick={() => {
										if (hasMethod) handleMethodToggle(variable);
										if (hasList) handleCodelistToggle(variable);
									}}
									onkeydown={(e) => {
										if (e.key === 'Enter') {
											if (hasMethod) handleMethodToggle(variable);
											if (hasList) handleCodelistToggle(variable);
										}
									}}
								>
									<div class="h-4 w-4 shrink-0">
										{#if isVariableMethodExpanded(variable) || isVariableCodelistExpanded(variable)}
											<ChevronDown />
										{:else}
											<ChevronRight />
										{/if}
									</div>
									<div class="truncate font-mono text-xs">
										{#if hasMethod}
											{methods.find((m) => m.OID === variable.MethodOID)?.Name ||
												variable.MethodOID}
										{:else if hasOrigin}
											{variable.itemDef.Origin}
										{:else if hasList}
											{getCodeList(variable.itemDef, codeLists)?.Name || 'Codelist'}
										{/if}
									</div>
								</div>
							{:else if hasOrigin}
								<div class="truncate font-mono text-xs">
									{variable.itemDef.Origin}
								</div>
							{/if}
						</div>
					</TableCell>
				</TableRow>

				<!-- Expansion row -->
				{#if isVariableExpanded(variable)}
					<TableRow data-expanded-row>
						<TableCell colspan={9} class="bg-muted/20 px-4 py-2">
							<!-- Only use grid if we have both method and codelist expanded -->
							<div
								class="w-full"
								class:grid={variable.MethodOID &&
									hasCodelist(variable, codeLists) &&
									isVariableMethodExpanded(variable) &&
									isVariableCodelistExpanded(variable)}
								class:grid-cols-2={variable.MethodOID &&
									hasCodelist(variable, codeLists) &&
									isVariableMethodExpanded(variable) &&
									isVariableCodelistExpanded(variable)}
								class:gap-6={variable.MethodOID &&
									hasCodelist(variable, codeLists) &&
									isVariableMethodExpanded(variable) &&
									isVariableCodelistExpanded(variable)}
							>
								<!-- Method section -->
								{#if variable.MethodOID && isVariableMethodExpanded(variable)}
									<div class="space-y-2">
										<pre
											class="whitespace-pre-wrap text-sm font-normal text-muted-foreground">{methods.find(
												(m) => m.OID === variable.MethodOID
											)?.Description || 'No description available'}</pre>

										{#if variable.itemDef?.Comment}
											<div class="mt-2 text-sm text-muted-foreground">
												{comments.find((c) => c.OID === variable.itemDef?.Comment)?.Description ||
													'No comment description available'}
											</div>
										{/if}
									</div>
								{/if}

								<!-- Codelist section -->
								{#if hasCodelist(variable, codeLists) && isVariableCodelistExpanded(variable)}
									<div class="space-y-2">
										{#if getCodeList(variable.itemDef, codeLists)}
											{@const codeList = getCodeList(variable.itemDef, codeLists)}
											<div class="space-y-2">
												{#if codeList.CodeListItems?.length}
													<div class="space-y-2">
														{#each codeList.CodeListItems as item}
															<div class="grid grid-cols-[100px,1fr] gap-2 text-sm">
																<code class="text-xs">{item.CodedValue}</code>
																<div>
																	{item.Decode?.TranslatedText}
																	{#if item.ExtendedValue}
																		<Badge class="ml-2 px-1 py-0">Extended</Badge>
																	{/if}
																	{#if item.Aliases?.length}
																		<div class="mt-1 text-xs text-muted-foreground">
																			Aliases: {item.Aliases.map(
																				(a) => `${a.Name} (${a.Context})`
																			).join(', ')}
																		</div>
																	{/if}
																</div>
															</div>
														{/each}
													</div>
												{/if}

												{#if codeList.EnumeratedItems?.length}
													<div class="space-y-2">
														{#each codeList.EnumeratedItems as item}
															<div class="flex gap-2 whitespace-nowrap text-sm">
																<code class="w-[100px] shrink-0 text-xs">{item.CodedValue}</code>
																{#if item.Aliases?.length}
																	<div
																		class="overflow-hidden text-ellipsis text-xs text-muted-foreground"
																	>
																		Aliases: {item.Aliases.map(
																			(a) => `${a.Name} (${a.Context})`
																		).join(', ')}
																	</div>
																{/if}
															</div>
														{/each}
													</div>
												{/if}

												{#if codeList.Aliases?.length}
													<div class="text-xs text-muted-foreground">
														Aliases: {codeList.Aliases.map((a) => `${a.Name} (${a.Context})`).join(
															', '
														)}
													</div>
												{/if}
											</div>
										{/if}
									</div>
								{/if}
							</div>
						</TableCell>
					</TableRow>
				{/if}
			{/each}
		</TableBody>
	</Table>
</div>
