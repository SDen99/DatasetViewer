// src/lib/components/data/cellFormatting.ts

import type { MaterializedCellValue } from '$lib/core/processors/defineXML/MaterializedVLM';

/**
 * Formats cell content for display
 */
export function formatCellContent(cell: MaterializedCellValue | any, column: string): string {
	if (!cell) return '';

	// If it's just a string or number
	if (typeof cell === 'string' || typeof cell === 'number') {
		return String(cell);
	}

	// If it's a VLM cell object
	if (cell.value !== undefined) {
		let content = '';

		// Value
		if (cell.value !== null) {
			content += `<div class="font-medium">${cell.value}</div>`;
		}

		// Origin info
		if (cell.originType) {
			content += `<div class="text-xs text-gray-500 mt-1">Origin: ${cell.originType}`;
			if (cell.originSource) {
				content += ` (${cell.originSource})`;
			}
			content += '</div>';
		}

		// Method info
		if (cell.methodDescription) {
			content += `<div class="text-xs text-gray-500 mt-1">Method: ${cell.methodDescription}</div>`;
		} else if (cell.methodOID) {
			content += `<div class="text-xs text-gray-500 mt-1">Method: ${cell.methodOID}</div>`;
		}

		// Comment info
		if (cell.commentText) {
			content += `<div class="text-xs text-gray-500 mt-1">Comment: ${cell.commentText}</div>`;
		}

		return content;
	}

	// Legacy support for the old VLM structure
	if (typeof cell === 'object') {
		try {
			return JSON.stringify(cell, null, 2);
		} catch (e) {
			return '[Complex Object]';
		}
	}

	return String(cell);
}
