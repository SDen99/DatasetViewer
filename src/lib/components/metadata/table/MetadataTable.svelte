<script lang="ts">
	import type { ParsedDefineXML, Method, Comment, CodeList, ItemRef } from '$lib/types/define-xml';
	import {
		Table,
		TableBody,
		TableCell,
		TableHead,
		TableHeader,
		TableRow
	} from '$lib/components/core/table';
	import { Badge } from '$lib/components/core/badge';
	import { metadataViewStore } from '$lib/core/stores/MetadataViewStore.svelte';
	import {
		isMethodExpanded,
		isCodelistExpanded,
		isAnyExpansionActive,
		toggleMethodExpansion,
		toggleCodelistExpansion,
		EXPANSION_TYPE
	} from '../shared/expansionUtils';
	import { hasCodelist, getCodeList } from '../shared/codelistUtils';
	import { ChevronDown, ChevronRight } from 'lucide-svelte';

	let { define, datasetName, filteredVariables, methods, comments, codeLists } = $props<{
		define: ParsedDefineXML;
		datasetName: string;
		filteredVariables: ItemRef[];
		methods: Method[];
		comments: Comment[];
		codeLists: CodeList[];
	}>();

	// Handle variable expansion
	function handleExpandToggle(variable: ItemRef) {
		if (variable.MethodOID) {
			toggleMethodExpansion(variable, datasetName);
		}
		if (hasCodelist(variable, codeLists)) {
			toggleCodelistExpansion(variable, datasetName);
		}
	}

	// Helper for checking expansion state for chevron
	function isExpanded(variable: ItemRef): boolean {
		return isAnyExpansionActive(variable, datasetName);
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
			{#each filteredVariables || [] as variable (variable.OID)}
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
						<div class="flex items-center gap-2">
							{#if variable.MethodOID || hasCodelist(variable, codeLists)}
								<div
									class="flex cursor-pointer items-center gap-2"
									role="button"
									tabindex="0"
									onclick={() => handleExpandToggle(variable)}
									onkeydown={(e) => e.key === 'Enter' && handleExpandToggle(variable)}
								>
									<div class="h-4 w-4 shrink-0">
										{#if isExpanded(variable)}
											<span class="inline-block rotate-90">›</span>
										{:else}
											<span class="inline-block">›</span>
										{/if}
									</div>
									<div class="truncate font-mono text-xs">
										{#if variable.MethodOID}
											{methods.find((m: Method) => m.OID === variable.MethodOID)?.Name ||
												variable.MethodOID}
										{:else if variable.itemDef?.Origin}
											{variable.itemDef.Origin}
										{:else if hasCodelist(variable, codeLists)}
											{getCodeList(variable.itemDef, codeLists)?.Name || 'Codelist'}
										{/if}
									</div>
								</div>
							{:else if variable.itemDef?.Origin}
								<div class="truncate font-mono text-xs">
									{variable.itemDef.Origin}
								</div>
							{/if}
						</div>
					</TableCell>
				</TableRow>

				<!-- Expansion row -->
				{#if isExpanded(variable)}
					<TableRow data-expanded-row>
						<TableCell colspan={9} class="bg-muted/20 px-4 py-2">
							<div
								class="w-full"
								class:grid={variable.MethodOID &&
									hasCodelist(variable, codeLists) &&
									isMethodExpanded(variable, datasetName) &&
									isCodelistExpanded(variable, datasetName)}
								class:grid-cols-2={variable.MethodOID &&
									hasCodelist(variable, codeLists) &&
									isMethodExpanded(variable, datasetName) &&
									isCodelistExpanded(variable, datasetName)}
								class:gap-6={variable.MethodOID &&
									hasCodelist(variable, codeLists) &&
									isMethodExpanded(variable, datasetName) &&
									isCodelistExpanded(variable, datasetName)}
							>
								<!-- Method section -->
								{#if variable.MethodOID && isMethodExpanded(variable, datasetName)}
									<div class="space-y-2">
										<div class="whitespace-pre-wrap text-sm font-normal text-muted-foreground">
											{methods.find((m: Method) => m.OID === variable.MethodOID)?.Description ||
												'No description available'}
										</div>

										{#if variable.itemDef?.Comment}
											<div class="mt-2 text-sm text-muted-foreground">
												{comments.find((c: Comment) => c.OID === variable.itemDef?.Comment)
													?.Description || 'No comment description available'}
											</div>
										{/if}
									</div>
								{/if}

								<!-- Codelist section -->
								{#if hasCodelist(variable, codeLists) && isCodelistExpanded(variable, datasetName)}
									{#if getCodeList(variable.itemDef, codeLists)}
										{@const codeList = getCodeList(variable.itemDef, codeLists)}
										<div class="space-y-2">
											{#if codeList?.CodeListItems?.length}
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
																		Aliases:{item.Aliases.map(
																			(a) => `${a.Name ?? ''} ${a.Context ? `(${a.Context})` : ''}`
																		).join(', ')}
																	</div>
																{/if}
															</div>
														</div>
													{/each}
												</div>
											{/if}

											{#if codeList?.EnumeratedItems?.length}
												<div class="space-y-2">
													{#each codeList.EnumeratedItems as item}
														<div class="flex gap-2 whitespace-nowrap text-sm">
															<code class="w-[100px] shrink-0 text-xs">{item.CodedValue}</code>
															{#if item.Aliases?.length}
																<div
																	class="overflow-hidden text-ellipsis text-xs text-muted-foreground"
																>
																	Aliases: {item.Aliases.map(
																		(a) => `${a.Name ?? ''} ${a.Context ? `(${a.Context})` : ''}`
																	).join(', ')}
																</div>
															{/if}
														</div>
													{/each}
												</div>
											{/if}

											{#if codeList?.Aliases?.length}
												<div class="text-xs text-muted-foreground">
													Aliases: {codeList.Aliases.map(
														(a) => `${a.Name ?? ''}${a.Context ? ` (${a.Context})` : ''}`
													)}
													).join(', ')}
												</div>
											{/if}
										</div>
									{/if}
								{/if}
							</div>
						</TableCell>
					</TableRow>
				{/if}
			{/each}
		</TableBody>
	</Table>
</div>
