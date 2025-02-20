import type { CodeList, itemDef, itemRef } from '$lib/core/processors/defineXML/types';

// Cache for codelist lookups
const codeListCache = new Map<string, CodeList | null>();

/**
 * Get codelist for a variable's itemDef
 */
export function getCodeList(
	itemDef: itemDef | undefined | null,
	codeLists: CodeList[]
): CodeList | null {
	if (!itemDef?.CodeListOID) return null;

	// Check cache first
	const cacheKey = itemDef.CodeListOID;
	if (codeListCache.has(cacheKey)) {
		return codeListCache.get(cacheKey) || null;
	}

	// Not in cache, look it up
	const foundCodeList = codeLists.find((cl) => cl.OID === itemDef.CodeListOID);

	// Cache the result (even if null)
	codeListCache.set(cacheKey, foundCodeList || null);

	return foundCodeList || null;
}

/**
 * Check if a variable has an associated codelist
 */
export function hasCodelist(
	variable: itemRef & { itemDef?: itemDef | null },
	codeLists: CodeList[]
): boolean {
	const hasCodeList = Boolean(
		variable.itemDef?.CodeListOID && getCodeList(variable.itemDef, codeLists) !== null
	);
	if (variable.itemDef?.CodeListOID) {
		console.log('hasCodelist check:', {
			variableOID: variable.OID,
			codeListOID: variable.itemDef.CodeListOID,
			hasCodeList
		});
	}
	return hasCodeList;
}

// Clear cache when needed (e.g., when loading new data)
export function clearCodeListCache(): void {
	codeListCache.clear();
}
