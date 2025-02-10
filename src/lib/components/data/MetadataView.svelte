<script lang="ts">
	import type { ParsedDefineXML, itemDef, itemRef } from '$lib/core/processors/defineXML/types';
	import { normalizeDatasetId } from '$lib/core/utils/datasetUtils';
	import { Badge } from '$lib/components/core/badge';
	import { Card, CardContent } from '$lib/components/core/card';
	import { Input } from '$lib/components/core/input';
	import { Search, Table as TableIcon, LayoutList } from 'lucide-svelte';
	import {
		Table,
		TableBody,
		TableCell,
		TableHead,
		TableHeader,
		TableRow
	} from '$lib/components/core/table';
	import { Button } from '$lib/components/core/button';

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

	let isTableView = $derived(view.isTable);

	let datasetMetadata = $derived(() => {
		const define = sdtmDefine || adamDefine;
		if (!define) return null;

		const normalizedName = normalizeDatasetId(datasetName);
		return define.itemGroups.find(
			(g: { Name: string }) => normalizeDatasetId(g.Name) === normalizedName
		);
	});

	interface EnhancedVariable extends itemRef {
		itemDef?: itemDef;
		hasVLM: boolean;
	}

	let baseVariables = $derived(() => {
		const define = sdtmDefine || adamDefine;
		if (!define || !datasetMetadata()) return [];

		const normalizedDatasetName = normalizeDatasetId(datasetName);

		const datasetRefs = define.itemRefs.filter((ref) => {
			const refDataset = ref.OID?.split('.')[1] || '';
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
</script>

{#if datasetMetadata()}
	<div class="flex h-[calc(100vh-12rem)] flex-col">
		<!-- Fixed Header Section -->
		<div class="flex-none space-y-6 p-4">
			<!-- Controls -->
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

		<!-- Scrollable Content Section -->
		<div class="flex-1 overflow-y-auto p-4 pt-0">
			{#if isTableView}
				<div class="rounded-lg border">
					<Table>
						<TableHeader>
							<TableRow class="bg-muted/50">
								<TableHead class="w-40">Order</TableHead>
								<TableHead class="w-32">Name</TableHead>
								<TableHead>Label</TableHead>
								<TableHead class="w-20">Type</TableHead>
								<TableHead class="w-20">Length</TableHead>
								<TableHead class="w-20">Format</TableHead>
								<TableHead class="w-16">Req</TableHead>
								<TableHead class="w-16">Orig</TableHead>
								<TableHead class="w-32">Origin Ref</TableHead>
								<TableHead class="w-32">Method OID</TableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							{#each filteredVariables() as variable}
								<TableRow>
									<TableCell class="font-mono text-sm">
										{variable.OrderNumber}
										{#if variable.KeySequence}
											<Badge variant="outline" class="py-0">K{variable.KeySequence}</Badge>
										{/if}
									</TableCell>

									<TableCell>
										<div class="flex items-center gap-1">
											<span class="font-mono">
												{variable.itemDef?.Name || variable.OID?.split('.')[2] || ''}
											</span>
											{#if variable.hasVLM}
												<Badge variant="secondary" class="px-1 py-0">VLM</Badge>
											{/if}
										</div>
									</TableCell>

									<TableCell class="text-sm">
										{variable.itemDef?.Description || '-'}
									</TableCell>

									<TableCell class="text-sm">{variable.itemDef?.DataType || '-'}</TableCell>
									<TableCell class="text-sm">{variable.itemDef?.Length || '-'}</TableCell>
									<TableCell class="font-mono text-sm">{variable.itemDef?.Format || '-'}</TableCell>

									<TableCell>
										<Badge
											variant={variable.Mandatory === 'Yes' ? 'default' : 'secondary'}
											class="px-1 py-0"
										>
											{variable.Mandatory === 'Yes' ? 'Y' : 'N'}
										</Badge>
									</TableCell>

									<TableCell class="text-sm">
										{#if variable.itemDef?.OriginType}
											<Badge variant="outline" class="px-1 py-0">
												{getOriginAbbrev(variable.itemDef.OriginType)}
											</Badge>
										{:else}
											-
										{/if}
									</TableCell>

									<TableCell class="font-mono text-xs">
										{variable.itemDef?.Origin || '-'}
									</TableCell>
									<TableCell class="font-mono text-xs">
										{variable.MethodOID || '-'}
									</TableCell>
								</TableRow>
							{/each}
						</TableBody>
					</Table>
				</div>
			{:else}
				<div class="max-w-5xl space-y-2">
					{#each filteredVariables() as variable}
						<Card>
							<CardContent class="p-4">
								<div class="flex gap-8">
									<!-- Variable Identifier Section -->
									<div class="w-48 shrink-0">
										<div class="flex items-center gap-2">
											<span class="font-mono font-medium">
												{variable.itemDef?.Name || variable.OID?.split('.')[2] || ''}
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
												<span class="ml-1 font-medium">{variable.itemDef?.DataType || '-'}</span>
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

										<!-- Method & Where Clause -->
										{#if variable.MethodOID || variable.WhereClauseOID}
											<div class="w-64 space-y-2">
												{#if variable.MethodOID}
													<div>
														<span class="text-sm text-muted-foreground">Method OID:</span>
														<code class="mt-1 block text-xs">
															{variable.MethodOID}
														</code>
													</div>
												{/if}
												{#if variable.WhereClauseOID}
													<div>
														<span class="text-sm text-muted-foreground">Where Clause:</span>
														<code class="mt-1 block text-xs">
															{variable.WhereClauseOID}
														</code>
													</div>
												{/if}
											</div>
										{/if}
									</div>
								</div>
							</CardContent>
						</Card>
					{/each}
				</div>
			{/if}
		</div>
	</div>
{:else}
	<div class="flex h-[200px] items-center justify-center text-muted-foreground">
		<p>No metadata available for this dataset</p>
	</div>
{/if}
