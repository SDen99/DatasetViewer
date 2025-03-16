import type { VLMItemRef } from '$lib/types/VLMtypes';

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

// Helper to create consistent label-value pairs - Modified to be more compact
function createLabelValue(label: string, value: string): string {
	return `<div class="mb-1">
	  <div class="flex">
		<div class="text-xs font-medium text-muted-foreground min-w-16">${label}:</div>
		<div class="pl-1">${value}</div>
	  </div>
	</div>`;
}

// Helper for creating section headers - Made more compact
function createSectionHeader(title: string, iconType: string): string {
	// Choose icon based on section type
	let iconSvg = '';
	switch (iconType) {
		case 'method':
			iconSvg =
				'<svg class="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 3v3m0 4.5v3m0 4.5v3M3 12h3m4.5 0h3m4.5 0h3"/></svg>';
			break;
		case 'where':
			iconSvg =
				'<svg class="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 9v6m6-6v6M5 5h14a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2z"/></svg>';
			break;
		case 'codelist':
			iconSvg =
				'<svg class="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 6h16M4 12h16M4 18h16"/></svg>';
			break;
		case 'origin':
			iconSvg =
				'<svg class="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 12V8H6a2 2 0 1 1 0-4h12v12a2 2 0 1 1-4 0v-4"/></svg>';
			break;
		default:
			iconSvg =
				'<svg class="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>';
	}

	// Return more compact header
	return `<div class="flex items-center gap-1 text-xs font-semibold mb-1">
		${iconSvg}
		<span>${title}</span>
	</div>`;
}

function formatMethodSection(method: any): string {
	if (!method) return '';

	const methodParts: string[] = [];

	if (method.Type) {
		methodParts.push(createLabelValue('Type', method.Type));
	}

	if (method.Description) {
		methodParts.push(createLabelValue('Description', method.Description));
	}

	// Format long text content with proper indentation
	// Set max-width to ensure proper wrapping
	if (method.TranslatedText) {
		methodParts.push(`
		<div class="mb-1">
		  <div class="flex">
			<div class="text-xs font-medium text-muted-foreground min-w-16">Details:</div>
			<div class="pl-1 max-w-[calc(100%-4rem)]">${method.TranslatedText}</div>
		  </div>
		</div>
	  `);
	}

	return methodParts.join('\n');
}

// Fix multi-line text handling in formatStandardCell
function formatMultilineText(item: any): string {
	// Check if it's a long text that might need proper wrapping
	if (typeof item === 'string' && item.length > 50) {
		return `<div class="whitespace-normal max-w-full">${item}</div>`;
	}
	return String(item);
}

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

	// Variable name as header - more compact
	parts.push(`<div class="mb-1 text-sm font-medium">${variableName} Definition</div>`);

	// ItemDef Description
	if (itemRef.itemDescription) {
		parts.push(createLabelValue('Description', itemRef.itemDescription));
	}

	// WhereClause Information
	if (itemRef.whereClause) {
		const whereClauseParts: string[] = [];

		if (itemRef.whereClause.source?.variable) {
			const comparator = formatComparator(itemRef.whereClause.comparator);
			const values = itemRef.whereClause.checkValues.join(', ');

			whereClauseParts.push(
				createLabelValue(
					'Condition',
					`${itemRef.whereClause.source.variable} ${comparator} ${values}`
				)
			);
		}

		if (whereClauseParts.length > 0) {
			parts.push(
				`<div class="mb-2">
					${createSectionHeader('Where Clause', 'where')}
					${whereClauseParts.join('\n')}
				</div>`
			);
		}
	}

	// Method Information
	if (itemRef.method) {
		const methodParts: string[] = [];

		if (itemRef.method.Type) {
			methodParts.push(createLabelValue('Type', itemRef.method.Type));
		}

		if (itemRef.method.Description) {
			methodParts.push(createLabelValue('Description', itemRef.method.Description));
		}

		if (itemRef.method.TranslatedText) {
			methodParts.push(createLabelValue('Details', itemRef.method.TranslatedText));
		}

		if (methodParts.length > 0) {
			parts.push(
				`<div class="mb-2">
					${createSectionHeader('Method', 'method')}
					${methodParts.join('\n')}
				</div>`
			);
		}
	}

	// Add Codelist formatting - more compact
	if (itemRef.codelist) {
		const codelistParts: string[] = [];

		if (itemRef.codelist.name) {
			codelistParts.push(createLabelValue('Name', itemRef.codelist.name));
		}

		if (itemRef.codelist.items?.length) {
			codelistParts.push(
				`<span class="text-xs font-medium text-muted-foreground mr-1">Values:</span>`
			);

			codelistParts.push('<div>');
			itemRef.codelist.items.forEach((item) => {
				codelistParts.push(
					`<div class="mb-1 pl-1">
						<span class="font-mono">${item.codedValue}</span>: ${item.decode}${
							item.isExtended ? ' <span class="text-xs">(Extended)</span>' : ''
						}</div>`
				);
			});
			codelistParts.push('</div>');
		}

		if (codelistParts.length > 0) {
			parts.push(
				`<div class="mb-2">
					${createSectionHeader('Codelist', 'codelist')}
					${codelistParts.join('\n')}
				</div>`
			);
		}
	}

	// Debug OIDs - more subtle
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
			`<div class="mt-2 text-xs font-mono text-gray-500">
				<span class="cursor-pointer underline" onclick="this.nextElementSibling.classList.toggle('hidden')">Debug OIDs</span>
				<div class="pl-2 hidden">
					${debugParts.join('\n					')}
				</div>
			</div>`
		);
	}

	return parts.join('\n') || '';
}

// Format standard parameterized cell
function formatStandardCell(itemRef: VLMItemRef, columnName: string): string {
	const parts: string[] = [];

	// ItemDef Description with proper indentation
	if (itemRef.itemDescription) {
		parts.push(`
		<div class="mb-2">
		  <div class="flex">
			<div class="text-xs font-medium text-muted-foreground min-w-20">Description:</div>
			<div class="pl-1">${itemRef.itemDescription}</div>
		  </div>
		</div>
	  `);
	}

	// Method Information with proper structure
	if (itemRef.method) {
		const methodParts: string[] = [];

		// Method header
		methodParts.push(`
		<div class="flex items-center gap-1 text-xs font-semibold mb-1">
		  <svg class="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
			<path d="M12 3v3m0 4.5v3m0 4.5v3M3 12h3m4.5 0h3m4.5 0h3"/>
		  </svg>
		  <span>Method</span>
		</div>
	  `);

		// Method type
		if (itemRef.method.Type) {
			methodParts.push(`
		  <div class="mb-1">
			<div class="flex">
			  <div class="text-xs font-medium text-muted-foreground min-w-16">Type:</div>
			  <div class="pl-1">${itemRef.method.Type}</div>
			</div>
		  </div>
		`);
		}

		// Method description with better text wrapping
		if (itemRef.method.Description) {
			methodParts.push(`
		  <div class="mb-1">
			<div class="flex">
			  <div class="text-xs font-medium text-muted-foreground min-w-16 shrink-0">Description:</div>
			  <div class="pl-1 whitespace-normal">${itemRef.method.Description}</div>
			</div>
		  </div>
		`);
		}

		parts.push(`
		<div class="mb-2 pb-1 border-b border-dashed last:mb-0 last:pb-0 last:border-0">
		  ${methodParts.join('')}
		</div>
	  `);
	}

	// WhereClause Information
	if (itemRef.whereClause) {
		const whereClauseParts: string[] = [];

		if (itemRef.whereClause.source?.variable) {
			const comparator = formatComparator(itemRef.whereClause.comparator);
			const values = itemRef.whereClause.checkValues.join(', ');

			whereClauseParts.push(
				createLabelValue(
					'Condition',
					`${itemRef.whereClause.source.variable} ${comparator} ${values}`
				)
			);
		}

		if (whereClauseParts.length > 0) {
			parts.push(
				`<div class="mb-2">
					${createSectionHeader('Where Clause', 'where')}
					${whereClauseParts.join('\n')}
				</div>`
			);
		}
	}

	// Add Codelist formatting
	if (itemRef.codelist) {
		const codelistParts: string[] = [];

		if (itemRef.codelist.name) {
			codelistParts.push(createLabelValue('Name', itemRef.codelist.name));
		}

		if (itemRef.codelist.items?.length) {
			codelistParts.push(
				`<span class="text-xs font-medium text-muted-foreground mr-1">Values:</span>`
			);

			codelistParts.push('<div>');
			itemRef.codelist.items.forEach((item) => {
				codelistParts.push(
					`<div class="mb-1 pl-1">
						<span class="font-mono">${item.codedValue}</span>: ${item.decode}${
							item.isExtended ? ' <span class="text-xs">(Extended)</span>' : ''
						}</div>`
				);
			});
			codelistParts.push('</div>');
		}

		if (codelistParts.length > 0) {
			parts.push(
				`<div class="mb-2">
					${createSectionHeader('Codelist', 'codelist')}
					${codelistParts.join('\n')}
				</div>`
			);
		}
	}

	// Display special variables if any exist and aren't already handled
	if (itemRef.specialVariables && Object.keys(itemRef.specialVariables).length > 0) {
		const specialParts: string[] = [];

		Object.entries(itemRef.specialVariables).forEach(([key, value]) => {
			// Skip the current column name to avoid duplication
			if (key !== columnName) {
				specialParts.push(createLabelValue(key, String(value)));
			}
		});

		if (specialParts.length > 0) {
			parts.push(
				`<div class="mb-2">
					${createSectionHeader('Special Variables', 'info')}
					${specialParts.join('\n')}
				</div>`
			);
		}
	}

	// Debug OIDs - collapsible for space savings
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
			`<div class="mt-2 text-xs font-mono text-gray-500">
				<span class="cursor-pointer underline" onclick="this.nextElementSibling.classList.toggle('hidden')">Debug OIDs</span>
				<div class="pl-2 hidden">
					${debugParts.join('\n					')}
				</div>
			</div>`
		);
	}

	return parts.join('\n') || '';
}
