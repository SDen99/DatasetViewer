<script lang="ts">
	import type {
		ParsedDefineXML,
		method,
		comment,
		CodeList,
		itemRef
	} from '$lib/core/processors/defineXML/types';
	import { Card, CardContent } from '$lib/components/core/card';
	import VariableDetails from '../shared/VariableDetails.svelte';
	import MethodCell from '$lib/components/data/MethodCell.svelte';
	import { metadataViewStore } from '$lib/core/stores/MetadataViewStore.svelte';
	import {
		toggleMethodExpansion,
		toggleCodelistExpansion,
		isMethodExpanded,
		isCodelistExpanded,
		isAnyExpansionActive,
		EXPANSION_TYPE
	} from '../shared/methodExpansionUtils';
	import { Badge } from '$lib/components/core/badge';
	import { ChevronDown, ChevronRight } from 'lucide-svelte';

	let { define, datasetName, filteredVariables, methods, comments, codeLists } = $props<{
		define: ParsedDefineXML;
		datasetName: string;
		filteredVariables: itemRef[];
		methods: method[];
		comments: comment[];
		codeLists: CodeList[];
	}>();

	// Use the store-provided expansion state directly
	const getExpandedMethodsSet = $derived(() => {
		const state = metadataViewStore.getDatasetState(datasetName);
		const methods = state.expandedMethods;

		if (methods instanceof Set) return methods;
		if (Array.isArray(methods)) return new Set(methods);
		return new Set();
	});

	// Helper function to get codelist for a variable
	function getCodeList(itemDef) {
		if (!itemDef?.CodeListOID) return null;
		return codeLists.find((cl) => cl.OID === itemDef.CodeListOID) || null;
	}

	// Check if variable has a codelist
	function hasCodelist(variable: itemRef & { itemDef?: itemDef }) {
		if (!variable?.itemDef?.CodeListOID) return false;
		const codeList = codeLists.find((cl) => cl.OID === variable.itemDef.CodeListOID);
		return codeList != null;
	}
</script>

<div class="h-full overflow-y-auto">
	<div class="max-w-5xl space-y-4">
		{#each filteredVariables as variable}
			<Card>
				<CardContent class="p-6">
					<div class="flex flex-col gap-4">
						<!-- Primary Variable Info - Top Row -->
						<div class="flex items-start justify-between">
							<!-- Left Column: Variable Details -->
							<div class="flex w-auto min-w-[250px] flex-col gap-2">
								<div class="flex items-center gap-2">
									<h3 class="font-mono text-lg font-medium">
										{variable.itemDef?.Name || variable.OID?.split('.')[2] || ''}
									</h3>
									<div class="flex gap-1">
										{#if variable.KeySequence}
											<Badge variant="outline" class="px-1 py-0">K{variable.KeySequence}</Badge>
										{/if}
										{#if variable.hasVLM}
											<Badge variant="secondary" class="px-1 py-0">VLM</Badge>
										{/if}
										{#if hasCodelist(variable)}
											<Badge variant="secondary" class="px-1 py-0">CL</Badge>
										{/if}
									</div>
								</div>

								<p class="text-sm text-muted-foreground">
									{variable.itemDef?.Description || '-'}
								</p>

								<div class="mt-1 grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
									<div>
										<span class="text-muted-foreground">Type:</span>
										<span class="ml-1 font-medium">{variable.itemDef?.DataType || '-'}</span>
									</div>
									<div>
										<span class="text-muted-foreground">Length:</span>
										<span class="ml-1 font-medium">{variable.itemDef?.Length || '-'}</span>
									</div>
									{#if variable.itemDef?.Format}
										<div class="col-span-2">
											<span class="text-muted-foreground">Format:</span>
											<span class="ml-1 font-mono">{variable.itemDef.Format}</span>
										</div>
									{/if}
									<div>
										<span class="text-muted-foreground">Order:</span>
										<span class="ml-1 font-mono">{variable.OrderNumber || '-'}</span>
									</div>
									<div>
										<Badge
											variant={variable.Mandatory === 'Yes' ? 'default' : 'secondary'}
											class="px-2 py-0.5"
										>
											{variable.Mandatory === 'Yes' ? 'Required' : 'Optional'}
										</Badge>
									</div>
								</div>
							</div>

							<!-- Right Column: Origin/Method -->
							<div class="min-w-[200px] max-w-[300px]">
								{#if variable.itemDef?.Origin}
									<div class="space-y-1">
										<div class="text-sm text-muted-foreground">Origin:</div>
										<div class="flex items-center gap-2">
											{#if variable.itemDef?.OriginType}
												<Badge variant="outline" class="px-2 py-0.5">
													{variable.itemDef.OriginType}
												</Badge>
											{/if}
											<code class="block text-xs">
												{variable.itemDef.Origin}
											</code>
										</div>
									</div>
								{:else if variable.MethodOID}
									<div class="space-y-1">
										<div class="text-sm text-muted-foreground">Method:</div>
										<MethodCell
											methodOID={variable.MethodOID}
											{methods}
											isExpanded={isMethodExpanded(variable, datasetName, getExpandedMethodsSet)}
											onToggle={() => toggleMethodExpansion(variable, datasetName)}
										/>
									</div>
								{:else if hasCodelist(variable)}
									<!-- Codelist toggle for variables without methods -->
									<div class="space-y-1">
										<div class="text-sm text-muted-foreground">Codelist:</div>
										<div
											class="flex cursor-pointer items-center gap-2"
											role="button"
											tabindex="0"
											onclick={() => toggleCodelistExpansion(variable, datasetName)}
											onkeydown={(e) =>
												e.key === 'Enter' && toggleCodelistExpansion(variable, datasetName)}
										>
											{#if isCodelistExpanded(variable, datasetName, getExpandedMethodsSet)}
												<ChevronDown class="h-4 w-4 shrink-0" />
											{:else}
												<ChevronRight class="h-4 w-4 shrink-0" />
											{/if}
											<span class="whitespace-normal font-mono text-xs">
												{getCodeList(variable.itemDef)?.Name || 'Codelist'}
											</span>
										</div>
									</div>
								{/if}
							</div>
						</div>

						<!-- Expanded Content Area -->
						{#if isAnyExpansionActive(variable, datasetName, getExpandedMethodsSet)}
							<div class="mt-4 border-t pt-4">
								<div
									class={hasCodelist(variable) &&
									variable.MethodOID &&
									isMethodExpanded(variable, datasetName, getExpandedMethodsSet) &&
									isCodelistExpanded(variable, datasetName, getExpandedMethodsSet)
										? 'grid grid-cols-2 gap-8'
										: 'w-full'}
								>
									<!-- Method section (if exists and expanded) -->
									{#if variable.MethodOID && isMethodExpanded(variable, datasetName, getExpandedMethodsSet)}
										<div
											class="space-y-3 {!hasCodelist(variable) ||
											!isCodelistExpanded(variable, datasetName, getExpandedMethodsSet)
												? 'col-span-2'
												: ''}"
										>
											<h4 class="text-sm font-medium">Method</h4>
											<div
												class="whitespace-pre-wrap rounded-md bg-muted/30 p-3 text-sm font-normal text-muted-foreground"
											>
												{methods.find((m) => m.OID === variable.MethodOID)?.Description ||
													'No description available'}
											</div>

											{#if variable.itemDef?.Comment}
												<div class="mt-2 space-y-1">
													<div class="text-sm font-medium">Comment:</div>
													<div class="rounded-md bg-muted/20 p-2 text-sm text-muted-foreground">
														{comments.find((c) => c.OID === variable.itemDef?.Comment)
															?.Description || 'No comment description available'}
													</div>
												</div>
											{/if}
										</div>
									{/if}

									<!-- Codelist section (if exists and expanded) -->
									{#if hasCodelist(variable) && isCodelistExpanded(variable, datasetName, getExpandedMethodsSet)}
										<div
											class="space-y-3 {!variable.MethodOID ||
											!isMethodExpanded(variable, datasetName, getExpandedMethodsSet)
												? 'col-span-2'
												: ''}"
										>
											{#if getCodeList(variable.itemDef)}
												{@const codeList = getCodeList(variable.itemDef)}
												<div class="space-y-3">
													<h4 class="text-sm font-medium">{codeList.Name}</h4>

													{#if codeList.CodeListItems?.length}
														<div class="space-y-2 rounded-md bg-muted/20 p-3">
															<div class="text-sm font-medium text-muted-foreground">
																Coded Values:
															</div>
															<div class="space-y-3">
																{#each codeList.CodeListItems as item}
																	<div
																		class="grid grid-cols-[100px,1fr] gap-3 border-b border-muted pb-2 text-sm last:border-0 last:pb-0"
																	>
																		<code class="text-xs font-semibold">{item.CodedValue}</code>
																		<div>
																			<div class="font-medium">
																				{item.Decode?.TranslatedText}
																				{#if item.ExtendedValue}
																					<Badge class="ml-2 px-1 py-0">Extended</Badge>
																				{/if}
																			</div>
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
														</div>
													{/if}

													{#if codeList.EnumeratedItems?.length}
														<div class="space-y-2 rounded-md bg-muted/20 p-3">
															<div class="text-sm font-medium text-muted-foreground">
																Enumerated Items:
															</div>
															<div class="space-y-2">
																{#each codeList.EnumeratedItems as item}
																	<div
																		class="flex gap-3 whitespace-nowrap border-b border-muted pb-2 text-sm last:border-0 last:pb-0"
																	>
																		<code class="w-[100px] shrink-0 text-xs font-semibold"
																			>{item.CodedValue}</code
																		>
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
														</div>
													{/if}

													{#if codeList.Aliases?.length}
														<div class="space-y-1">
															<div class="text-sm font-medium text-muted-foreground">
																CodeList Aliases:
															</div>
															<div class="rounded-md bg-muted/20 p-2 text-xs text-muted-foreground">
																{codeList.Aliases.map((a) => `${a.Name} (${a.Context})`).join(', ')}
															</div>
														</div>
													{/if}
												</div>
											{/if}
										</div>
									{/if}
								</div>
							</div>
						{/if}
					</div>
				</CardContent>
			</Card>
		{/each}
	</div>
</div>
