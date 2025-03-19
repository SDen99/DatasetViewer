import { vlmStore } from '$lib/core/stores/VLMStore.svelte';

/**
 * Gets the column width from the VLM store
 */
export function getColumnWidth(datasetName: string, column: string): number {
  if (!column || !datasetName) return 150;

  try {
    const storeWidths = vlmStore.getColumnWidths(datasetName);
    if (storeWidths && typeof storeWidths[column] === 'number' && storeWidths[column] > 0) {
      return storeWidths[column];
    }
  } catch (e) {
    console.warn(`Error getting width from store for ${column}:`, e);
  }

  // Default width
  return 150;
}

/**
 * Updates the column width in the DOM
 */
export function forceUpdateColumnWidth(column: string, width: number): void {
  if (!column || !width) return;

  const selector = `[data-column="${column}"]`;
  const elements = document.querySelectorAll(selector);

  elements.forEach((el) => {
    if (el instanceof HTMLElement) {
      // Set both width and min-width to ensure it takes effect
      el.style.width = `${width}px`;
      el.style.minWidth = `${width}px`;
      el.style.maxWidth = `${width}px`;
    }
  });
}

/**
 * Applies all column widths to the DOM
 */
export function applyAllColumnWidths(datasetName: string, columns: string[]): void {
  if (!columns || !datasetName) return;

  columns.forEach((column) => {
    const width = getColumnWidth(datasetName, column);
    forceUpdateColumnWidth(column, width);
  });
}

/**
 * Helper function to format comparators
 */
export function formatComparator(comparator: string): string {
  switch (comparator) {
    case 'EQ': return '=';
    case 'NE': return '≠';
    case 'LT': return '<';
    case 'LE': return '≤';
    case 'GT': return '>';
    case 'GE': return '≥';
    case 'IN': return 'in';
    case 'NOTIN': return 'not in';
    default: return comparator;
  }
}

/**
 * Generate a unique ID for each section
 */
export function getSectionId(paramcd: string, column: string, sectionType: string): string {
  return `${paramcd}_${column}_${sectionType}`;
}