export function formatCellContent(itemRef: VLMItemRef, columnName: string): string {
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

	return parts.join('\n') || '';
}
