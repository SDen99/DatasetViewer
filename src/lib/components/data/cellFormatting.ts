export function formatCellContent(itemRef: VLMItemRef, columnName: string): string {
	console.log('Raw ItemRef data:', {
		column: columnName,
		data: itemRef,
		whereClause: itemRef.whereClause,
		method: itemRef.method,
		valueListDef: itemRef.valueListDef,
		// Dump all keys at root level
		keys: Object.keys(itemRef)
	});
	if (!itemRef) return '';

	if (columnName === 'PARAMCD') return itemRef.paramcd || '';
	if (columnName === 'PARAM') return itemRef.paramInfo?.decode || '';

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

		if (itemRef.method.type) {
			methodParts.push(
				`<span class="text-xs font-semibold uppercase text-muted-foreground">Type:</span> ${itemRef.method.type}`
			);
		}

		if (itemRef.method.description) {
			methodParts.push(
				`<span class="text-xs font-semibold uppercase text-muted-foreground">Description:</span> ${itemRef.method.description}`
			);
		}

		if (itemRef.method.translatedText) {
			methodParts.push(
				`<span class="text-xs font-semibold uppercase text-muted-foreground">Details:</span> ${itemRef.method.translatedText}`
			);
		}

		if (itemRef.method.document) {
			methodParts.push(
				`<span class="text-xs font-semibold uppercase text-muted-foreground">Document:</span> ${itemRef.method.document}`
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
	//Debug
	const debugParts: string[] = [];
	if (itemRef.valueListOID) {
		debugParts.push(`ValueList OID: ${itemRef.valueListOID}`);
	}
	if (itemRef.whereClause?.whereClauseOID) {
		debugParts.push(`WhereClause OID: ${itemRef.whereClause.whereClauseOID}`);
	}
	if (itemRef.whereClause?.itemOID) {
		debugParts.push(`Item OID: ${itemRef.whereClause.itemOID}`);
	}
	if (itemRef.methodOID) {
		debugParts.push(`Method OID: ${itemRef.methodOID}`);
	}
	if (itemRef.itemDefOID) {
		debugParts.push(`ItemDef OID: ${itemRef.itemDefOID}`);
	}

	if (debugParts.length > 0) {
		parts.push(
			`\n<span class="mt-2 block border-t border-dashed pt-2 text-xs text-gray-500">Debug OIDs:\n  ${debugParts.join('\n  ')}</span>`
		);
	}

	return parts.join('\n') || '';
}
