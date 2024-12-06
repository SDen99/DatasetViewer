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

	export let data: any[];
	export let selectedColumns: Set<string>;
	export let columnOrder: string[];
	export let onReorderColumns: (newOrder: string[]) => void;

	let draggedColumn: string | null = null;
	let dragOverColumn: string | null = null;

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

	$: tableData = data.map((row) => {
		const visibleData: Record<string, any> = {};
		visibleColumns.forEach((col) => {
			visibleData[col] = row[col];
		});
		return visibleData;
	});
</script>

<div class="rounded-md border">
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
		<TableBody>
			{#each tableData.slice(0, 10) as row}
				<TableRow>
					{#each visibleColumns as column}
						<TableCell>{row[column]}</TableCell>
					{/each}
				</TableRow>
			{/each}
		</TableBody>
	</Table>
</div>
