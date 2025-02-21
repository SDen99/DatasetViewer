<script lang="ts">
	import type {
		ParsedDefineXML,
		method,
		comment,
		CodeList,
		itemRef
	} from '$lib/core/processors/defineXML/types';
	import { Card, CardContent } from '$lib/components/core/card';
	import { Badge } from '$lib/components/core/badge';
	import { metadataViewStore } from '$lib/core/stores/MetadataViewStore.svelte';
	import {
		isMethodExpanded,
		isCodelistExpanded,
		isAnyExpansionActive,
		toggleExpansion,
		EXPANSION_TYPE
	} from '../shared/expansionUtils';
	import { hasCodelist, getCodeList } from '../shared/codelistUtils';
	import { ChevronDown, ChevronRight } from 'lucide-svelte';

	let { define, datasetName, filteredVariables, methods, comments, codeLists } = $props<{
		define: ParsedDefineXML;
		datasetName: string;
		filteredVariables: itemRef[];
		methods: method[];
		comments: comment[];
		codeLists: CodeList[];
	}>();

	// Handle variable expansion
	function handleExpandToggle(variable: itemRef) {
		if (variable.MethodOID) {
			toggleExpansion(variable, datasetName, EXPANSION_TYPE.METHOD);
		}
		if (hasCodelist(variable, codeLists)) {
			toggleExpansion(variable, datasetName, EXPANSION_TYPE.CODELIST);
		}
	}

	// Helper for checking expansion state for chevron
	function isExpanded(variable: itemRef): boolean {
		return isAnyExpansionActive(variable, datasetName);
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
										{#if hasCodelist(variable, codeLists)}
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

							<!-- Right Column: Source -->
							<div class="min-w-[200px] max-w-[300px]">
								<div class="flex items-center gap-2">
									{#if variable.itemDef?.OriginType}
										<Badge
											variant={variable.itemDef.OriginType === 'Derived' ? 'default' : 'outline'}
											class="shrink-0 px-1.5 py-0"
										>
											{variable.itemDef.OriginType}
										</Badge>
									{/if}

									{#if variable.MethodOID || hasCodelist(variable, codeLists)}
										<div
											class="flex cursor-pointer items-center gap-2 overflow-hidden"
											role="button"
											tabindex="0"
											onclick={() => handleExpandToggle(variable)}
											onkeydown={(e) => e.key === 'Enter' && handleExpandToggle(variable)}
										>
											<div class="h-4 w-4 shrink-0">
												{#if isExpanded(variable)}
													<ChevronDown />
												{:else}
													<ChevronRight />
												{/if}
											</div>
											<div
												class="overflow-hidden text-ellipsis whitespace-nowrap font-mono text-sm"
											>
												{#if variable.itemDef?.Origin}
													{variable.itemDef.Origin}
												{:else if variable.MethodOID}
													{methods.find((m) => m.OID === variable.MethodOID)?.Name}
												{:else if hasCodelist(variable, codeLists)}
													{getCodeList(variable.itemDef, codeLists)?.Name}
												{/if}
											</div>
										</div>
									{/if}
								</div>
							</div>
						</div>

						<!-- Expansion Content Area -->
						{#if isExpanded(variable)}
							<div class="mt-4 border-t pt-4">
								<div
									class="grid gap-6"
									class:grid-cols-2={variable.MethodOID && hasCodelist(variable, codeLists)}
								>
									<!-- Method section -->
									{#if variable.MethodOID && isMethodExpanded(variable, datasetName)}
										<div class="space-y-2">
											<pre class="whitespace-pre-wrap text-sm font-normal text-muted-foreground">
                        {methods.find((m) => m.OID === variable.MethodOID)?.Description ||
													'No description available'}
                    </pre>

											{#if variable.itemDef?.Comment}
												<div class="mt-2 text-sm text-muted-foreground">
													{comments.find((c) => c.OID === variable.itemDef?.Comment)?.Description ||
														'No comment description available'}
												</div>
											{/if}
										</div>
									{/if}

									<!-- Codelist section -->
									{#if hasCodelist(variable, codeLists) && isCodelistExpanded(variable, datasetName)}
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
