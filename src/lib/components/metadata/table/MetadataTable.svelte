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
	import VariableDetails from '../shared/VariableDetails.svelte';
	import MethodCell from '$lib/components/data/MethodCell.svelte';
	import MethodExpansion from '../shared/MethodExpansion.svelte';
	import { metadataViewStore } from '$lib/core/stores/MetadataViewStore.svelte';
	import { toggleMethodExpansion } from '../shared/methodExpansionUtils';
	import { ChevronDown, ChevronRight } from 'lucide-svelte';

	let { define, datasetName, filteredVariables, methods, comments, codeLists } = $props<{
		define: ParsedDefineXML;
		datasetName: string;
		filteredVariables: itemRef[];
		methods: method[];
		comments: comment[];
		codeLists: CodeList[];
	}>();

	// Access expandedMethods directly from the store, with safety checks
	function getExpandedMethodsSet() {
		const state = metadataViewStore.getDatasetState(datasetName);
		const methods = state.expandedMethods;

		if (methods instanceof Set) return methods;
		if (Array.isArray(methods)) return new Set(methods);
		return new Set();
	}

	// Create simplified helper to check expansion
	function isExpanded(variableOID, methodOID) {
		if (!variableOID) return false;
		const key = methodOID ? `${variableOID}-${methodOID}` : `${variableOID}-codelist`;
		const expandedSet = getExpandedMethodsSet();
		return expandedSet.has(key);
	}

	// Helper function to get codelist for a variable
	function getCodeList(itemDef) {
		if (!itemDef?.CodeListOID) return null;
		return codeLists.find((cl) => cl.OID === itemDef.CodeListOID) || null;
	}

	// Toggle expansion for codelist-only variables
	function toggleCodelistExpansion(variable) {
		if (!variable.OID) return;

		const methodKey = `${variable.OID}-codelist`;
		console.log(`Toggling codelist expansion: ${methodKey}`);

		// Toggle the expansion
		metadataViewStore.toggleMethod(datasetName, methodKey);
	}

	// Check if variable has a codelist
	function hasCodelist(variable) {
		return variable.itemDef?.CodeListOID && getCodeList(variable.itemDef) !== null;
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
							{#if hasCodelist(variable)}
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
						{#if variable.itemDef?.Origin}
							<code class="text-xs">
								{variable.itemDef.Origin}
							</code>
						{:else if variable.MethodOID}
							<MethodCell
								methodOID={variable.MethodOID}
								{methods}
								isExpanded={isExpanded(variable.OID, variable.MethodOID)}
								onToggle={() => toggleMethodExpansion(variable, datasetName)}
							/>
						{:else if hasCodelist(variable)}
							<!-- Codelist toggle cell for variables without methods -->
							<div
								class="flex cursor-pointer items-center gap-2"
								role="button"
								tabindex="0"
								onclick={() => toggleCodelistExpansion(variable)}
								onkeydown={(e) => e.key === 'Enter' && toggleCodelistExpansion(variable)}
							>
								{#if isExpanded(variable.OID, null)}
									<ChevronDown class="h-4 w-4 shrink-0" />
								{:else}
									<ChevronRight class="h-4 w-4 shrink-0" />
								{/if}
								<span class="whitespace-normal font-mono text-xs">Codelist</span>
							</div>
						{:else if variable.itemDef?.Comment}
							<div class="text-xs">
								{comments.find((c) => c.OID === variable.itemDef?.Comment)?.Description ||
									'No comment description available'}
							</div>
						{/if}
					</TableCell>
				</TableRow>

				<!-- Expansion row - only renders when needed -->
				{#if (variable.MethodOID && isExpanded(variable.OID, variable.MethodOID)) || (!variable.MethodOID && hasCodelist(variable) && isExpanded(variable.OID, null))}
					<TableRow data-expanded-row>
						<TableCell colspan="9" class="bg-muted/20 px-4 py-2">
							<div
								class={hasCodelist(variable) && variable.MethodOID
									? 'grid grid-cols-2 gap-6'
									: 'w-full'}
							>
								<!-- Method section - left side when expanded -->
								{#if variable.MethodOID && isExpanded(variable.OID, variable.MethodOID)}
									<div class="space-y-2 {!hasCodelist(variable) ? 'col-span-2' : ''}">
										<h4 class="text-sm font-medium">Method</h4>
										<pre class="whitespace-pre-wrap text-sm font-normal text-muted-foreground">
						{methods.find((m) => m.OID === variable.MethodOID)?.Description || 'No description available'}
					  </pre>

										{#if variable.itemDef?.Comment}
											<div class="mt-2 space-y-1">
												<div class="text-sm text-muted-foreground">
													Comment:
													{comments.find((c) => c.OID === variable.itemDef?.Comment)?.Description ||
														'No comment description available'}
												</div>
											</div>
										{/if}
									</div>
								{/if}

								<!-- Codelist section - right side -->
								{#if hasCodelist(variable)}
									<div class="space-y-2 {!variable.MethodOID ? 'col-span-2' : ''}">
										{#if getCodeList(variable.itemDef)}
											{@const codeList = getCodeList(variable.itemDef)}
											<div class="space-y-2">
												<div class="text-sm font-medium">{codeList.Name}</div>

												{#if codeList.CodeListItems?.length}
													<div class="space-y-1">
														<div class="text-sm font-medium text-muted-foreground">
															Coded Values:
														</div>
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
													<div class="space-y-1">
														<div class="text-sm font-medium text-muted-foreground">
															Enumerated Items:
														</div>
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
													<div class="space-y-1">
														<div class="text-sm font-medium text-muted-foreground">
															CodeList Aliases:
														</div>
														<div class="text-xs text-muted-foreground">
															{codeList.Aliases.map((a) => `${a.Name} (${a.Context})`).join(', ')}
														</div>
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
