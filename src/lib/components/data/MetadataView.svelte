<script lang="ts">
	import type { ParsedDefineXML } from '$lib/core/processors/defineXML/types';
	import { normalizeDatasetId } from '$lib/core/utils/datasetUtils';
	import { Badge } from '$lib/components/core/badge';
	import { Card, CardContent } from '$lib/components/core/card';
	import { Input } from '$lib/components/core/input';
	import { Search, Table as TableIcon, LayoutList, ChevronDown, ChevronRight } from 'lucide-svelte';
	import {
		Table,
		TableBody,
		TableCell,
		TableHead,
		TableHeader,
		TableRow
	} from '$lib/components/core/table';
	import { Button } from '$lib/components/core/button';
	import MethodCell from '$lib/components/data/MethodCell.svelte';

	let { sdtmDefine, adamDefine, datasetName } = $props<{
		sdtmDefine: ParsedDefineXML | null;
		adamDefine: ParsedDefineXML | null;
		datasetName: string;
	}>();

	const ORIGIN_ABBREV: Record<string, string> = {
		Collected: 'CRF',
		Derived: 'DER',
		Assigned: 'ASG',
		Protocol: 'PRT',
		Predecessor: 'PRE'
	};

	let searchTerm = $state('');
	let view = $state({ isTable: true });
	let expandedMethodKeys = $state<Set<string>>(new Set());

	let isTableView = $derived(view.isTable);

	let datasetMetadata = $derived(() => {
		const define = sdtmDefine || adamDefine;
		if (!define) return null;

		const normalizedName = normalizeDatasetId(datasetName);
		return define.itemGroups.find(
			(g: { Name: string }) => normalizeDatasetId(g.Name) === normalizedName
		);
	});

	let methods = $derived((sdtmDefine || adamDefine)?.methods || []);
	let comments = $derived((sdtmDefine || adamDefine)?.comments || []);

	let baseVariables = $derived(() => {
		const define = sdtmDefine || adamDefine;
		if (!define || !datasetMetadata()) return [];

		const normalizedDatasetName = normalizeDatasetId(datasetName);

		const datasetRefs = define.itemRefs.filter((ref) => {
			let refDataset;
			if (sdtmDefine) {
				refDataset = ref.OID?.split('.')[0] || '';
			} else if (adamDefine) {
				refDataset = ref.OID?.split('.')[1] || '';
			}
			return normalizeDatasetId(refDataset) === normalizedDatasetName;
		});

		const itemDefsMap = new Map(define.itemDefs.map((def) => [def.OID, def]));
		const vlmVars = new Set(
			define.valueListDefs.map((vld) => vld.OID?.split(`VL.${datasetName}.`)[1]).filter(Boolean)
		);

		return datasetRefs
			.map((ref) => {
				const varName = ref.OID?.split('.')[2] || '';
				return {
					...ref,
					itemDef: itemDefsMap.get(ref.OID),
					hasVLM: vlmVars.has(varName)
				};
			})
			.sort((a, b) => {
				return parseInt(a.OrderNumber || '0') - parseInt(b.OrderNumber || '0');
			});
	});

	let allMethodsExpanded = $derived(
		filteredVariables().every((v) =>
			v.MethodOID ? expandedMethodKeys.has(getMethodKey(v.OID, v.MethodOID)) : true
		)
	);

	function toggleAllMethods(expand: boolean) {
		const newExpanded = new Set<string>();
		if (expand) {
			filteredVariables().forEach((variable) => {
				if (variable.MethodOID) {
					newExpanded.add(getMethodKey(variable.OID, variable.MethodOID));
				}
			});
		}
		expandedMethodKeys = newExpanded;
	}

	let filteredVariables = $derived(() => {
		const vars = baseVariables();
		if (!vars?.length) return [];

		const searchLower = searchTerm.toLowerCase();
		if (!searchLower) return vars;

		return vars.filter((variable) => {
			const name = variable.itemDef?.Name?.toLowerCase() || '';
			const description = variable.itemDef?.Description?.toLowerCase() || '';
			return name.includes(searchLower) || description.includes(searchLower);
		});
	});

	function getOriginAbbrev(originType: string | undefined): string {
		if (!originType) return '-';
		return ORIGIN_ABBREV[originType] || originType;
	}

	function getMethodKey(variableOID: string | undefined, methodOID: string | undefined): string {
		return `${variableOID || ''}-${methodOID || ''}`;
	}
</script>

{#if datasetMetadata()}
	<!-- Main container - takes up all available space minus the top nav -->
	<div class="flex h-[calc(100vh-12rem)] flex-col">
		<!-- Controls section - fixed height -->
		<div class="flex-none p-4">
			<div class="flex items-center justify-between">
				<div class="relative w-64">
					<Search class="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
					<Input
						type="text"
						placeholder="Search variables..."
						class="pl-8"
						bind:value={searchTerm}
					/>
				</div>

				<div class="flex items-center gap-4">
					<!-- expand/collapse all button -->
					<Button
						variant="outline"
						size="sm"
						class="gap-2"
						onclick={() => toggleAllMethods(!allMethodsExpanded)}
					>
						{#if allMethodsExpanded}
							<ChevronDown class="h-4 w-4" />
							<span>Collapse All</span>
						{:else}
							<ChevronRight class="h-4 w-4" />
							<span>Expand All</span>
						{/if}
					</Button>
				</div>

				<div class="flex gap-2">
					<Button
						variant="default"
						size="icon"
						onclick={() => (view.isTable = true)}
						aria-label="Table view"
					>
						<TableIcon class="h-4 w-4" />
					</Button>
					<Button
						variant="default"
						size="icon"
						onclick={() => (view.isTable = false)}
						aria-label="Card view"
					>
						<LayoutList class="h-4 w-4" />
					</Button>
				</div>
			</div>
		</div>

		<!-- Content section - takes remaining height -->
		<div class="flex-1 overflow-hidden px-4">
			{#if isTableView}
				<!-- Table container with border -->
				<div class="flex h-full flex-col rounded-lg border">
					<Table>
						<!-- Fixed header -->
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

						<!-- Scrollable body -->
						<TableBody class="overflow-y-auto">
							{#each filteredVariables() as variable}
								<TableRow>
									<TableCell style="min-width: 160px; width: 160px" class="font-mono text-sm">
										{variable.OrderNumber}
										{#if variable.KeySequence}
											<Badge variant="outline" class="py-0">
												K{variable.KeySequence}
											</Badge>
										{/if}
									</TableCell>

									<TableCell style="min-width: 128px; width: 128px">
										<div class="flex items-center gap-1">
											<span class="font-mono">
												{variable.itemDef?.Name || variable.OID?.split('.')[2] || ''}
											</span>
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
												{getOriginAbbrev(variable.itemDef.OriginType)}
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
												isExpanded={variable.MethodOID
													? expandedMethodKeys.has(getMethodKey(variable.OID, variable.MethodOID))
													: false}
												onToggle={() => {
													if (variable.MethodOID) {
														const methodKey = getMethodKey(variable.OID, variable.MethodOID);
														const newExpanded = new Set(expandedMethodKeys);
														if (newExpanded.has(methodKey)) {
															newExpanded.delete(methodKey);
														} else {
															newExpanded.add(methodKey);
														}
														expandedMethodKeys = newExpanded;
													}
												}}
											/>
										{:else if variable.itemDef?.Comment}
											<div class="text-xs">
												{comments.find((c) => c.OID === variable.itemDef?.Comment)?.Description ||
													'No comment description available'}
											</div>
										{/if}
									</TableCell>
								</TableRow>

								{#if variable.MethodOID && expandedMethodKeys.has(getMethodKey(variable.OID, variable.MethodOID))}
									<TableRow>
										<TableCell colspan="9" class="bg-muted/20 px-4 py-2">
											<pre
												class="whitespace-pre-wrap text-sm font-normal text-muted-foreground">{methods.find(
													(m) => m.OID === variable.MethodOID
												)?.Description || 'No description available'}</pre>

											{#if variable.itemDef?.Comment}
												<div class="mt-2 space-y-1">
													<div class="text-sm text-muted-foreground">
														Comment:
														{comments.find((c) => c.OID === variable.itemDef?.Comment)
															?.Description || 'No comment description available'}
													</div>
												</div>
											{/if}
										</TableCell>
									</TableRow>
								{/if}
							{/each}
						</TableBody>
					</Table>
				</div>
			{:else}
				<!-- Card view - directly scrollable -->
				<div class="h-full overflow-y-auto">
					<div class="max-w-5xl space-y-2">
						{#each filteredVariables() as variable}
							<Card>
								<CardContent class="p-4">
									<div class="flex flex-col gap-4">
										<!-- Main Content -->
										<div class="flex gap-8">
											<!-- Variable Identifier Section -->
											<div class="w-48 shrink-0">
												<div class="flex items-center gap-2">
													<span class="font-mono font-medium">
														{variable.itemDef?.Name || variable.OID?.split('.')[2] || ''}
													</span>
													<div class="flex gap-1">
														{#if variable.KeySequence}
															<Badge variant="outline" class="px-1 py-0"
																>K{variable.KeySequence}</Badge
															>
														{/if}
														{#if variable.hasVLM}
															<Badge variant="secondary" class="px-1 py-0">VLM</Badge>
														{/if}
													</div>
												</div>
												<p class="mt-1 text-sm text-muted-foreground">
													{variable.itemDef?.Description || '-'}
												</p>
											</div>

											<!-- Technical Details Section -->
											<div class="flex items-start gap-8">
												<!-- Core Properties -->
												<div class="w-32 space-y-1">
													<div class="text-sm">
														<span class="text-muted-foreground">Type:</span>
														<span class="ml-1 font-medium">{variable.itemDef?.DataType || '-'}</span
														>
													</div>
													<div class="text-sm">
														<span class="text-muted-foreground">Length:</span>
														<span class="ml-1 font-medium">{variable.itemDef?.Length || '-'}</span>
													</div>
													{#if variable.itemDef?.Format}
														<div class="text-sm">
															<span class="text-muted-foreground">Format:</span>
															<span class="ml-1 font-mono">{variable.itemDef.Format}</span>
														</div>
													{/if}
												</div>

												<!-- Status -->
												<div class="w-32 space-y-1">
													<div class="text-sm">
														<Badge
															variant={variable.Mandatory === 'Yes' ? 'default' : 'secondary'}
															class="px-1 py-0"
														>
															{variable.Mandatory === 'Yes' ? 'Required' : 'Optional'}
														</Badge>
													</div>
													{#if variable.itemDef?.OriginType}
														<div class="text-sm">
															<Badge variant="outline" class="px-1 py-0">
																{getOriginAbbrev(variable.itemDef.OriginType)}
															</Badge>
														</div>
													{/if}
												</div>

												<!-- Origin Reference -->
												{#if variable.itemDef?.Origin}
													<div class="w-64">
														<span class="text-sm text-muted-foreground">Origin:</span>
														<code class="mt-1 block text-xs">
															{variable.itemDef.Origin}
														</code>
													</div>
												{/if}

												<!-- Method  -->
												{#if variable.MethodOID}
													<div class="w-64 space-y-2">
														<div>
															<MethodCell
																methodOID={variable.MethodOID}
																{methods}
																isExpanded={variable.MethodOID
																	? expandedMethodKeys.has(
																			getMethodKey(variable.OID, variable.MethodOID)
																		)
																	: false}
																onToggle={() => {
																	if (variable.MethodOID) {
																		const methodKey = getMethodKey(
																			variable.OID,
																			variable.MethodOID
																		);
																		const newExpanded = new Set(expandedMethodKeys);
																		if (newExpanded.has(methodKey)) {
																			newExpanded.delete(methodKey);
																		} else {
																			newExpanded.add(methodKey);
																		}
																		expandedMethodKeys = newExpanded;
																	}
																}}
															/>
														</div>
													</div>
												{/if}
											</div>
										</div>

										<!-- Expanded Method Section -->
										{#if variable.MethodOID && expandedMethodKeys.has(getMethodKey(variable.OID, variable.MethodOID))}
											<div class="mt-2 border-t pt-4">
												<pre
													class="whitespace-pre-wrap text-sm font-normal text-muted-foreground">{methods.find(
														(m) => m.OID === variable.MethodOID
													)?.Description || 'No description available'}</pre>
											</div>
											{#if variable.itemDef?.Comment}
												<div class="space-y-2 text-sm text-muted-foreground">
													Comment:
													{comments.find((c) => c.OID === variable.itemDef?.Comment)?.Description ||
														'No comment description available'}
												</div>
											{/if}
										{/if}
									</div>
								</CardContent>
							</Card>
						{/each}
					</div>
				</div>
			{/if}
		</div>
	</div>
{:else}
	<div class="flex h-[200px] items-center justify-center text-muted-foreground">
		<p>No metadata available for this dataset</p>
	</div>
{/if}
