<script lang="ts">
	import { run } from 'svelte/legacy';

	import {
		Table,
		TableBody,
		TableCell,
		TableHead,
		TableHeader,
		TableRow
	} from '$lib/components/ui/table';
	import { GripVertical, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-svelte';
	import { onMount, onDestroy } from 'svelte';
	import { browser } from '$app/environment';
	import { selectedColumns, columnOrder, columnWidths, datasetActions } from '$lib/stores/stores';

	interface Props {
  data: Record<string, any>[];
}


	type SortDirection = 'asc' | 'desc' | null;
  
  interface SortState {
    column: string | null;
    direction: SortDirection;
  }


  let { data = [] }: Props = $props();

	let draggedColumn: string | null = null;
	let dragOverColumn: string | null = $state(null);
	let resizingColumn: string | null = null;
	let startX: number = 0;
	let startWidth: number = 0;
	let scrollContainer: HTMLElement | null = $state(null);
	let mounted = $state(false);
	let sort = $state<SortState>({
    column: null,
    direction: null
  });

	// Virtualization constants
	const ROW_HEIGHT = 35; // Height of each row in pixels
	const BUFFER_SIZE = 5; // Number of rows to render above/below viewport
	let viewportHeight = $state(0);
	let scrollTop = $state(0);
	let visibleStartIndex = $state(0);
	let visibleEndIndex = $state(0);

	const MIN_COLUMN_WIDTH = 100;
	const DEFAULT_COLUMN_WIDTH = 200;


	let sortedData = () => {
  console.log('Input data:', data); // Debug input
  
  // Ensure data is defined and is an array
  if (!data || !Array.isArray(data)) {
    console.log('Data is not valid array, returning empty array');
    return [];
  }

  // Create defensive copy of data
  const workingData = [...data];

  // If no sorting, return copy of original array
  if (!sort.column || !sort.direction) {
    console.log('No sorting applied, returning original data');
    return workingData;
  }

  console.log('Applying sort:', { column: sort.column, direction: sort.direction });

  try {
    return workingData.sort((a, b) => {
      // Ensure a and b are objects
      if (!a || !b) return 0;

      // Safely access values
      const aVal = a[sort.column!];
      const bVal = b[sort.column!];

      // Handle null/undefined values
      if (aVal == null && bVal == null) return 0;
      if (aVal == null) return sort.direction === 'asc' ? -1 : 1;
      if (bVal == null) return sort.direction === 'asc' ? 1 : -1;

      // Handle different types of values
      if (typeof aVal === 'number' && typeof bVal === 'number') {
        return sort.direction === 'asc' ? aVal - bVal : bVal - aVal;
      }

      // Handle dates
      if (aVal instanceof Date && bVal instanceof Date) {
        return sort.direction === 'asc' ? 
          aVal.getTime() - bVal.getTime() : 
          bVal.getTime() - aVal.getTime();
      }

      // Convert to strings for string comparison
      const aStr = String(aVal || '').toLowerCase();
      const bStr = String(bVal || '').toLowerCase();
      
      return sort.direction === 'asc' 
        ? aStr.localeCompare(bStr)
        : bStr.localeCompare(aStr);
    });
  } catch (error) {
    console.error('Error during sort:', error);
    return workingData; // Return unsorted data if sort fails
  }
};


  // Then calculate visible rows
  let visibleData = () => {
  if (!mounted || !browser || !Array.isArray(sorted) || !visibleColumns.length) {
    return [];
  }

  return sorted
    .slice(visibleStartIndex, visibleEndIndex)
    .map((row) => {
      const visibleRowData: Record<string, any> = {};
      visibleColumns.forEach((col) => {
        visibleRowData[col] = row[col];
      });
      return visibleRowData;
    });
};

let visible = $derived(visibleData());
let sorted = $derived(sortedData());

  function toggleSort(column: string) {
    if (sort.column === column) {
      if (sort.direction === 'asc') {
        sort = { column, direction: 'desc' };
      } else if (sort.direction === 'desc') {
        sort = { column: null, direction: null };
      } else {
        sort = { column, direction: 'asc' };
      }
    } else {
      sort = { column, direction: 'asc' };
    }
  }

  // Virtualization state
  let totalHeight = $derived(Array.isArray(sorted) ? sorted.length * ROW_HEIGHT : 0);

// Update the run effect to handle array check
run(() => {
  if (mounted && scrollContainer && Array.isArray(sorted)) {
    viewportHeight = scrollContainer.clientHeight;
    const visibleRows = Math.ceil(viewportHeight / ROW_HEIGHT);
    visibleStartIndex = Math.max(0, Math.floor(scrollTop / ROW_HEIGHT) - BUFFER_SIZE);
    visibleEndIndex = Math.min(
      sorted.length,
      visibleStartIndex + visibleRows + 2 * BUFFER_SIZE
    );
  }
});

	function handleScroll(event: Event) {
		scrollTop = (event.target as HTMLElement).scrollTop;
	}

	onMount(() => {
		mounted = true;
		if (!browser) return;

		// Initial viewport calculation
		if (scrollContainer) {
			viewportHeight = scrollContainer.clientHeight;
			const visibleRows = Math.ceil(viewportHeight / ROW_HEIGHT);
			visibleEndIndex = Math.min(data.length, visibleRows + 2 * BUFFER_SIZE);
		}
	});

	function handleDragStart(e: DragEvent, column: string) {
		draggedColumn = column;
		if (e.dataTransfer) {
			e.dataTransfer.effectAllowed = 'move';
			e.dataTransfer.setData('text/plain', column);
		}
	}

	function handleDragOver(e: DragEvent, column: string) {
		e.preventDefault();
		if (draggedColumn === column) return;
		dragOverColumn = column;
	}

	function handleDrop(e: DragEvent, targetColumn: string) {
		e.preventDefault();

		if (!draggedColumn || draggedColumn === targetColumn) {
			dragOverColumn = null;
			return;
		}

		const fromIndex = $columnOrder.indexOf(draggedColumn);
		const toIndex = $columnOrder.indexOf(targetColumn);

		const newOrder = [...$columnOrder];
		newOrder.splice(fromIndex, 1);
		newOrder.splice(toIndex, 0, draggedColumn);

		datasetActions.updateColumnOrder(newOrder);
		dragOverColumn = null;
		draggedColumn = null;
	}

	function handleDragLeave() {
		dragOverColumn = null;
	}

	function handleDragEnd() {
		draggedColumn = null;
		dragOverColumn = null;
	}

	function handleMouseMove(e: MouseEvent) {
		if (!resizingColumn) return;
		const diff = e.clientX - startX;
		const newWidth = Math.max(MIN_COLUMN_WIDTH, startWidth + diff);
		datasetActions.updateColumnWidth(resizingColumn, newWidth);
	}

	function startResize(e: MouseEvent, column: string) {
		e.preventDefault();
		e.stopPropagation();
		resizingColumn = column;
		startX = e.clientX;
		startWidth = $columnWidths[column] || DEFAULT_COLUMN_WIDTH;

		document.addEventListener('mousemove', handleMouseMove);
		document.addEventListener('mouseup', stopResize);
	}

	function stopResize() {
		resizingColumn = null;
		document.removeEventListener('mousemove', handleMouseMove);
		document.removeEventListener('mouseup', stopResize);
	}

	function handleKeyResize(e: KeyboardEvent, column: string) {
		if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
			e.preventDefault();
			const delta = e.key === 'ArrowLeft' ? -10 : 10;
			const currentWidth = $columnWidths[column] || DEFAULT_COLUMN_WIDTH;
			const newWidth = Math.max(MIN_COLUMN_WIDTH, currentWidth + delta);
			datasetActions.updateColumnWidth(column, newWidth);
		}
	}

	let visibleColumns =
		$derived($columnOrder.length > 0 && $selectedColumns.size > 0
			? $columnOrder.filter((col) => $selectedColumns.has(col))
			: []);


	let totalWidth = $derived(visibleColumns.reduce(
		(sum, col) => sum + ($columnWidths[col] || DEFAULT_COLUMN_WIDTH),
		0
	));


	let getColumnStyle = $derived((column: string) => {
		const width = $columnWidths[column] || DEFAULT_COLUMN_WIDTH;
		return `width: ${width}px; min-width: ${width}px; max-width: ${width}px;`;
	});

	onDestroy(() => {
		document.removeEventListener('mousemove', handleMouseMove);
		document.removeEventListener('mouseup', stopResize);
	});


</script>

{#if browser}

<div class="relative h-full overflow-hidden">
	<div class="overflow-x-auto">
	  <div style="width: {totalWidth}px">
		<div class="sticky top-0 z-10 bg-background">
		  <Table>
			<TableHeader>
			  <TableRow>
				{#each visibleColumns as column}
				  <TableHead
					class="relative {dragOverColumn === column ? 'border-l-2 border-primary' : ''}"
					style={getColumnStyle(column)}
				  >
					<div
					  class="flex h-full items-center gap-2 select-none"
					  draggable={true}
					  role="button"
					  tabindex="0"
					  ondragstart={(e) => handleDragStart(e, column)}
					  ondragover={(e) => handleDragOver(e, column)}
					  ondragleave={handleDragLeave}
					  ondrop={(e) => handleDrop(e, column)}
					  ondragend={handleDragEnd}
					>
					  <div class="cursor-move rounded p-1 hover:bg-muted">
						<GripVertical class="h-4 w-4 text-muted-foreground" />
					  </div>
					  
					  <button 
						class="flex items-center gap-2 flex-1"
						onclick={() => toggleSort(column)}
					  >
						<span>{column}</span>
						<div class="text-muted-foreground">
						  {#if sort.column === column}
							{#if sort.direction === 'asc'}
							  <ArrowUp class="h-4 w-4" />
							{:else if sort.direction === 'desc'}
							  <ArrowDown class="h-4 w-4" />
							{/if}
						  {:else}
							<ArrowUpDown class="h-4 w-4 opacity-50" />
						  {/if}
						</div>
					  </button>
  
					  <div
						role="separator"
						aria-label="Resize column"
						class="absolute right-0 top-0 h-full w-0.5 cursor-col-resize bg-gray-300 p-0 hover:w-1 hover:bg-primary focus:bg-primary focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
						onmousedown={(e) => startResize(e, column)}
						onkeydown={(e) => handleKeyResize(e, column)}
					  ></div>
					</div>
				  </TableHead>
				{/each}
			  </TableRow>
			</TableHeader>
		  </Table>
		</div>
  
		<div
        bind:this={scrollContainer}
        class="overflow-y-auto"
        style="max-height: calc(100vh - 41px);"
        onscroll={handleScroll}
      >
        <div style="height: {totalHeight}px; position: relative;">
          <div style="position: absolute; top: {visibleStartIndex * ROW_HEIGHT}px; left: 0; right: 0;">
            <Table>
              <TableBody>
                {#each visible as row, i (visibleStartIndex + i)}
                  <TableRow style="height: {ROW_HEIGHT}px;">
                    {#each visibleColumns as column}
                      <TableCell
                        style={getColumnStyle(column)}
                        class="border-b border-l border-gray-200 p-1 truncate"
                      >
                        {row[column]}
                      </TableCell>
                    {/each}
                  </TableRow>
                {/each}
              </TableBody>
            </Table>
          </div>
        </div>
      </div>
    </div>
  </div>
</div>
{/if}