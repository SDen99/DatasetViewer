import type { itemRef, itemDef, CodeList } from '$lib/core/processors/defineXML/types';
import { metadataViewStore } from '$lib/core/stores/MetadataViewStore.svelte';
import { hasCodelist } from './codelistUtils';

export const EXPANSION_TYPE = {
	METHOD: 'method',
	CODELIST: 'codelist'
} as const;

type ExpansionType = (typeof EXPANSION_TYPE)[keyof typeof EXPANSION_TYPE];

/**
 * Generate a consistent key for tracking expansion state
 */
export function getExpansionKey(
	variableOID: string,
	expansionType: ExpansionType,
	methodOID?: string
): string {
	if (expansionType === EXPANSION_TYPE.METHOD && methodOID) {
		return `${variableOID}-${methodOID}`;
	}
	return `${variableOID}-codelist`;
}

/**
 * Check if a specific expansion is active
 */
export function isExpanded(
	variable: itemRef,
	datasetName: string,
	expansionType: ExpansionType
): boolean {
	if (!variable.OID) return false;

	const { expansions } = metadataViewStore.getDatasetState(datasetName);

	const key = getExpansionKey(
		variable.OID,
		expansionType,
		expansionType === EXPANSION_TYPE.METHOD ? variable.MethodOID : undefined
	);

	return expansions.has(key);
}

/**
 * Toggle a specific expansion
 */
export function toggleExpansion(
	variable: itemRef,
	datasetName: string,
	expansionType: ExpansionType
): void {
	if (!variable.OID) return;

	// For method expansions, we need a MethodOID
	if (expansionType === EXPANSION_TYPE.METHOD && !variable.MethodOID) return;

	const key = getExpansionKey(
		variable.OID,
		expansionType,
		expansionType === EXPANSION_TYPE.METHOD ? variable.MethodOID : undefined
	);

	metadataViewStore.toggleExpansion(datasetName, key);
}

/**
 * Check if any expansion is active for a variable
 */
export function isAnyExpansionActive(variable: itemRef, datasetName: string): boolean {
	const methodExpanded = variable.MethodOID
		? isExpanded(variable, datasetName, EXPANSION_TYPE.METHOD)
		: false;

	const codelistExpanded = isExpanded(variable, datasetName, EXPANSION_TYPE.CODELIST);

	return methodExpanded || codelistExpanded;
}

/**
 * Get all possible expansion keys for a dataset
 */
export function getAllExpansionKeys(
	variables: itemRef[],
	datasetName: string,
	codeLists: CodeList[]
): string[] {
	const keys: string[] = [];

	variables.forEach((variable) => {
		if (!variable.OID) return;

		if (variable.MethodOID) {
			keys.push(getExpansionKey(variable.OID, EXPANSION_TYPE.METHOD, variable.MethodOID));
		}

		if (hasCodelist(variable, codeLists)) {
			keys.push(getExpansionKey(variable.OID, EXPANSION_TYPE.CODELIST));
		}
	});

	return keys;
}

// Convenience wrappers to maintain existing API
export function isMethodExpanded(variable: itemRef, datasetName: string): boolean {
	return isExpanded(variable, datasetName, EXPANSION_TYPE.METHOD);
}

export function isCodelistExpanded(variable: itemRef, datasetName: string): boolean {
	return isExpanded(variable, datasetName, EXPANSION_TYPE.CODELIST);
}

export function toggleMethodExpansion(variable: itemRef, datasetName: string): void {
	toggleExpansion(variable, datasetName, EXPANSION_TYPE.METHOD);
}

export function toggleCodelistExpansion(variable: itemRef, datasetName: string): void {
	toggleExpansion(variable, datasetName, EXPANSION_TYPE.CODELIST);
}
