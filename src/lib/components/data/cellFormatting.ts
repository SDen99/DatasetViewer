import type { VLMItemRef } from '$lib/core/processors/defineXML/VLMProcessingLogic';

export function formatCellContent(itemRef: VLMItemRef, columnName: string): string {
	console.log('Raw ItemRef data:', {
		column: columnName,
		data: itemRef,
		whereClause: itemRef.whereClause,
		method: itemRef.method,
		valueListDef: itemRef.valueListOID,
		isNonParameterized: itemRef.isNonParameterized,
		// Dump all keys at root level
		keys: Object.keys(itemRef)
	});

	if (!itemRef) return '';

	// Special handling for non-parameterized items
	if (itemRef.isNonParameterized) {
		// For PARAMCD column, show the special marker
		if (columnName === 'PARAMCD') return '*';

		// For PARAM column, show a special label
		if (columnName === 'PARAM') {
			return 'Non-Parameter Specific Definition';
		}

		// Add special styling for non-parameterized cells
		const variableName = itemRef.valueListOID?.split('.')?.[2] || columnName;
		return formatNonParameterizedCell(itemRef, variableName);
	} else {
		// Regular handling for parameterized items
		if (columnName === 'PARAMCD') return itemRef.paramcd || '';
		if (columnName === 'PARAM') return itemRef.paramInfo?.decode || '';
	}

	// Standard rendering for all cells
	return formatStandardCell(itemRef, columnName);
}

// Format non-parameterized cell with special styling
function formatNonParameterizedCell(itemRef: VLMItemRef, variableName: string): string {
	const parts: string[] = [];

	// Variable name as header
	parts.push(
		`<div class="p-1 mb-2 bg-secondary/20 rounded-sm text-sm font-medium">${variableName} Definition</div>`
	);

	// ItemDef Description
	if (itemRef.itemDescription) {
		parts.push(
			`<span class="text-xs font-semibold uppercase text-muted-foreground">Description:</span> ${itemRef.itemDescription}\n`
		);
	}

	// WhereClause Information
	if (itemRef.whereClause) {
		const whereClauseParts: string[] = [];

		if (itemRef.whereClause.source?.variable) {
			const comparator = formatComparator(itemRef.whereClause.comparator);
			const values = itemRef.whereClause.checkValues.join(', ');

			whereClauseParts.push(
				`<span class="text-xs font-semibold uppercase text-muted-foreground">Condition:</span> ${itemRef.whereClause.source.variable} ${comparator} ${values}`
			);
		}

		if (whereClauseParts.length > 0) {
			parts.push(
				`<span class="text-xs font-semibold uppercase text-muted-foreground">Where Clause:</span>\n  ${whereClauseParts.join('\n  ')}\n`
			);
		}
	}

	// Method Information
	if (itemRef.method) {
		const methodParts: string[] = [];

		if (itemRef.method.Type) {
			methodParts.push(
				`<span class="text-xs font-semibold uppercase text-muted-foreground">Type:</span> ${itemRef.method.Type}`
			);
		}

		if (itemRef.method.Description) {
			methodParts.push(
				`<span class="text-xs font-semibold uppercase text-muted-foreground">Description:</span> ${itemRef.method.Description}`
			);
		}

		if (itemRef.method.TranslatedText) {
			methodParts.push(
				`<span class="text-xs font-semibold uppercase text-muted-foreground">Details:</span> ${itemRef.method.TranslatedText}`
			);
		}

		if (methodParts.length > 0) {
			parts.push(
				`<span class="text-xs font-semibold uppercase text-muted-foreground">Method:</span>\n  ${methodParts.join('\n  ')}\n`
			);
		}
	}

	// Add Codelist formatting
	if (itemRef.codelist) {
		const codelistParts: string[] = [];

		if (itemRef.codelist.name) {
			codelistParts.push(
				`<span class="text-xs font-semibold uppercase text-muted-foreground">Name:</span> ${itemRef.codelist.name}`
			);
		}

		if (itemRef.codelist.items?.length) {
			codelistParts.push(
				`<span class="text-xs font-semibold uppercase text-muted-foreground">Values:</span>`
			);
			itemRef.codelist.items.forEach((item) => {
				codelistParts.push(
					`  <span class="font-mono">${item.codedValue}</span>: ${item.decode}${
						item.isExtended ? ' <span class="text-xs">(Extended)</span>' : ''
					}`
				);
			});
		}

		if (codelistParts.length > 0) {
			parts.push(
				`<span class="text-xs font-semibold uppercase text-muted-foreground">Codelist:</span>\n  ${codelistParts.join('\n  ')}\n`
			);
		}
	}

	// Debug OIDs
	const debugParts: string[] = [];
	if (itemRef.valueListOID) {
		debugParts.push(`ValueList OID: ${itemRef.valueListOID}`);
	}
	if (itemRef.whereClause?.whereClauseOID) {
		debugParts.push(`WhereClause OID: ${itemRef.whereClause.whereClauseOID}`);
	}
	if (itemRef.OID) {
		debugParts.push(`ItemDef OID: ${itemRef.OID}`);
	}

	if (debugParts.length > 0) {
		parts.push(
			`\n<span class="mt-2 block border-t border-dashed pt-2 text-xs text-gray-500">Debug OIDs:\n  ${debugParts.join('\n  ')}</span>`
		);
	}

	return parts.join('\n') || '';
}

// Format standard parameterized cell
function formatStandardCell(itemRef: VLMItemRef, columnName: string): string {
	const parts: string[] = [];

	// ItemDef Description
	if (itemRef.itemDescription) {
		parts.push(
			`<span class="text-xs font-semibold uppercase text-muted-foreground">Description:</span> ${itemRef.itemDescription}\n`
		);
	}

	// Origin Information
	if (itemRef.origin) {
		const originParts: string[] = [];

		if (itemRef.origin.type) {
			originParts.push(
				`<span class="text-xs font-semibold uppercase text-muted-foreground">Type:</span> ${itemRef.origin.type}`
			);
		}

		if (itemRef.origin.source) {
			originParts.push(
				`<span class="text-xs font-semibold uppercase text-muted-foreground">Source:</span> ${itemRef.origin.source}`
			);
		}

		if (itemRef.origin.translatedText) {
			originParts.push(
				`<span class="text-xs font-semibold uppercase text-muted-foreground">Details:</span> ${itemRef.origin.translatedText}`
			);
		}

		if (itemRef.origin.description) {
			originParts.push(
				`<span class="text-xs font-semibold uppercase text-muted-foreground">Notes:</span> ${itemRef.origin.description}`
			);
		}

		if (originParts.length > 0) {
			parts.push(
				`<span class="text-xs font-semibold uppercase text-muted-foreground">Origin:</span>\n  ${originParts.join('\n  ')}\n`
			);
		}
	}

	// Method Information
	if (itemRef.method) {
		const methodParts: string[] = [];

		if (itemRef.method.Type) {
			methodParts.push(
				`<span class="text-xs font-semibold uppercase text-muted-foreground">Type:</span> ${itemRef.method.Type}`
			);
		}

		if (itemRef.method.Description) {
			methodParts.push(
				`<span class="text-xs font-semibold uppercase text-muted-foreground">Description:</span> ${itemRef.method.Description}`
			);
		}

		if (itemRef.method.TranslatedText) {
			methodParts.push(
				`<span class="text-xs font-semibold uppercase text-muted-foreground">Details:</span> ${itemRef.method.TranslatedText}`
			);
		}

		if (itemRef.method.Document) {
			methodParts.push(
				`<span class="text-xs font-semibold uppercase text-muted-foreground">Document:</span> ${itemRef.method.Document}`
			);
		}

		if (methodParts.length > 0) {
			parts.push(
				`<span class="text-xs font-semibold uppercase text-muted-foreground">Method:</span>\n  ${methodParts.join('\n  ')}\n`
			);
		}
	}

	// WhereClause Information
	if (itemRef.whereClause) {
		const whereClauseParts: string[] = [];

		if (itemRef.whereClause.source?.variable) {
			const comparator = formatComparator(itemRef.whereClause.comparator);
			const values = itemRef.whereClause.checkValues.join(', ');

			whereClauseParts.push(
				`<span class="text-xs font-semibold uppercase text-muted-foreground">Condition:</span> ${itemRef.whereClause.source.variable} ${comparator} ${values}`
			);
		}

		if (whereClauseParts.length > 0) {
			parts.push(
				`<span class="text-xs font-semibold uppercase text-muted-foreground">Where Clause:</span>\n  ${whereClauseParts.join('\n  ')}\n`
			);
		}
	}

	// Add Codelist formatting
	if (itemRef.codelist) {
		const codelistParts: string[] = [];

		if (itemRef.codelist.name) {
			codelistParts.push(
				`<span class="text-xs font-semibold uppercase text-muted-foreground">Name:</span> ${itemRef.codelist.name}`
			);
		}

		if (itemRef.codelist.items?.length) {
			codelistParts.push(
				`<span class="text-xs font-semibold uppercase text-muted-foreground">Values:</span>`
			);
			itemRef.codelist.items.forEach((item) => {
				codelistParts.push(
					`  <span class="font-mono">${item.codedValue}</span>: ${item.decode}${
						item.isExtended ? ' <span class="text-xs">(Extended)</span>' : ''
					}`
				);
			});
		}

		if (codelistParts.length > 0) {
			parts.push(
				`<span class="text-xs font-semibold uppercase text-muted-foreground">Codelist:</span>\n  ${codelistParts.join('\n  ')}\n`
			);
		}
	}

	// Display special variables if any exist and aren't already handled
	if (itemRef.specialVariables && Object.keys(itemRef.specialVariables).length > 0) {
		const specialParts: string[] = [];

		Object.entries(itemRef.specialVariables).forEach(([key, value]) => {
			// Skip the current column name to avoid duplication
			if (key !== columnName) {
				specialParts.push(
					`<span class="text-xs font-semibold uppercase text-muted-foreground">${key}:</span> ${value}`
				);
			}
		});

		if (specialParts.length > 0) {
			parts.push(
				`<span class="text-xs font-semibold uppercase text-muted-foreground">Special Variables:</span>\n  ${specialParts.join('\n  ')}\n`
			);
		}
	}

	// Debug OIDs
	const debugParts: string[] = [];
	if (itemRef.valueListOID) {
		debugParts.push(`ValueList OID: ${itemRef.valueListOID}`);
	}
	if (itemRef.whereClause?.whereClauseOID) {
		debugParts.push(`WhereClause OID: ${itemRef.whereClause.whereClauseOID}`);
	}
	if (itemRef.whereClause?.OID) {
		debugParts.push(`Item OID: ${itemRef.whereClause.OID}`);
	}
	if (itemRef.methodOID) {
		debugParts.push(`Method OID: ${itemRef.methodOID}`);
	}
	if (itemRef.OID) {
		debugParts.push(`ItemDef OID: ${itemRef.OID}`);
	}

	if (debugParts.length > 0) {
		parts.push(
			`\n<span class="mt-2 block border-t border-dashed pt-2 text-xs text-gray-500">Debug OIDs:\n  ${debugParts.join('\n  ')}</span>`
		);
	}

	return parts.join('\n') || '';
}

// Helper to format comparator for display
function formatComparator(comparator: string): string {
	switch (comparator) {
		case 'EQ':
			return '=';
		case 'NE':
			return '≠';
		case 'LT':
			return '<';
		case 'LE':
			return '≤';
		case 'GT':
			return '>';
		case 'GE':
			return '≥';
		case 'IN':
			return 'in';
		case 'NOTIN':
			return 'not in';
		default:
			return comparator;
	}
}
