<script lang="ts">
	import {
		Table,
		TableBody,
		TableCell,
		TableHead,
		TableHeader,
		TableRow
	} from '$lib/components/ui/table';
	import { GripVertical } from 'lucide-svelte';
	import { onMount } from 'svelte';
	import { browser } from '$app/environment';

	export let data: any[];
	export let selectedColumns: Set<string>;
	export let columnOrder: string[];
	export let onReorderColumns: (newOrder: string[]) => void;

	let draggedColumn: string | null = null;
	let dragOverColumn: string | null = null;
	let loadMoreTrigger: HTMLElement;
	let pageSize = 50;
	let currentPage = 1;
	let mounted = false;

	onMount(() => {
		mounted = true;

		if (!browser) return;

		const observer = new IntersectionObserver(
			(entries) => {
				entries.forEach((entry) => {
					if (entry.isIntersecting && currentPage * pageSize < data.length) {
						currentPage++;
					}
				});
			},
			{
				rootMargin: '100px'
			}
		);

		if (loadMoreTrigger) {
			observer.observe(loadMoreTrigger);
		}

		return () => {
			if (loadMoreTrigger) {
				observer.unobserve(loadMoreTrigger);
			}
		};
	});

	function handleDragStart(e: DragEvent, column: string) {
		if (!(e.target as HTMLElement).closest('[role="button"]')) {
			e.preventDefault();
			return;
		}

		draggedColumn = column;
		if (e.dataTransfer) {
			e.dataTransfer.effectAllowed = 'move';
			e.dataTransfer.setData('text/plain', column);
		}
	}

	function handleDragOver(e: DragEvent, column: string) {
		e.preventDefault();
		if (e.dataTransfer) {
			e.dataTransfer.dropEffect = 'move';
		}
		dragOverColumn = column;
	}

	function handleDragLeave() {
		dragOverColumn = null;
	}

	function handleDrop(e: DragEvent, targetColumn: string) {
		e.preventDefault();
		dragOverColumn = null;

		if (!draggedColumn || draggedColumn === targetColumn) return;

		const newOrder = [...columnOrder];
		const fromIndex = newOrder.indexOf(draggedColumn);
		const toIndex = newOrder.indexOf(targetColumn);

		newOrder.splice(fromIndex, 1);
		newOrder.splice(toIndex, 0, draggedColumn);

		onReorderColumns(newOrder);
		draggedColumn = null;
	}

	$: visibleColumns = columnOrder.filter((col) => selectedColumns.has(col));

	$: visibleData =
		browser && mounted
			? data.slice(0, currentPage * pageSize).map((row) => {
					const visibleRowData: Record<string, any> = {};
					visibleColumns.forEach((col) => {
						visibleRowData[col] = row[col];
					});
					return visibleRowData;
				})
			: [];
</script>

{#if browser}
	<div class="flex h-[600px] flex-col overflow-hidden rounded-md border">
		<!-- Fixed Header -->
		<div class="sticky top-0 z-10 border-b bg-background">
			<Table>
				<TableHeader>
					<TableRow>
						{#each visibleColumns as column}
							<TableHead
								class="relative {dragOverColumn === column ? 'border-l-2 border-primary' : ''}"
								draggable={false}
							>
								<div class="flex items-center gap-2">
									<div
										role="button"
										tabindex="0"
										aria-label="Drag to reorder column"
										draggable="true"
										on:dragstart={(e) => handleDragStart(e, column)}
										on:dragover={(e) => handleDragOver(e, column)}
										on:dragleave={handleDragLeave}
										on:drop={(e) => handleDrop(e, column)}
										class="cursor-move rounded p-1 hover:bg-muted focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
									>
										<GripVertical class="h-4 w-4 text-muted-foreground" />
									</div>
									<span class="select-none">{column}</span>
								</div>
							</TableHead>
						{/each}
					</TableRow>
				</TableHeader>
			</Table>
		</div>

		<!-- Scrollable Content -->
		<div class="flex-1 overflow-auto">
			<Table>
				<TableBody>
					{#each visibleData as row}
						<TableRow>
							{#each visibleColumns as column}
								<TableCell>{row[column]}</TableCell>
							{/each}
						</TableRow>
					{/each}
					<!-- Intersection Observer trigger -->
					<tr bind:this={loadMoreTrigger} class="h-1" />
				</TableBody>
			</Table>
		</div>
	</div>
{/if}
