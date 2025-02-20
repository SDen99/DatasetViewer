import { metadataViewStore } from '$lib/core/stores/MetadataViewStore.svelte';
import type { itemRef } from '$lib/core/processors/defineXML/types';

// Constants for expansion types
export const EXPANSION_TYPE = {
	METHOD: 'method',
	CODELIST: 'codelist'
};

/**
 * Generate a consistent key for tracking expansion state
 */
export function getExpansionKey(
	variableOID: string,
	expansionType: string,
	methodOID?: string
): string {
	// For method expansions, use methodOID
	if (expansionType === EXPANSION_TYPE.METHOD && methodOID) {
		return `${variableOID}-${methodOID}`;
	}
	// For codelist expansions, use a consistent suffix
	return `${variableOID}-codelist`;
}

/**
 * Check if a method is expanded
 */
export function isMethodExpanded(
	variable: itemRef,
	datasetName: string,
	expandedMethods: Set<string> | string[] | undefined
): boolean {
	if (!variable.MethodOID || !variable.OID) return false;

	// Ensure expandedMethods is a Set
	const methodsSet =
		expandedMethods instanceof Set
			? expandedMethods
			: new Set(Array.isArray(expandedMethods) ? expandedMethods : []);

	const methodKey = getExpansionKey(variable.OID, EXPANSION_TYPE.METHOD, variable.MethodOID);
	return methodsSet.has(methodKey);
}

/**
 * Check if a codelist is expanded
 */
export function isCodelistExpanded(
	variable: itemRef,
	datasetName: string,
	expandedMethods: Set<string> | string[] | undefined
): boolean {
	if (!variable.OID) return false;

	// Ensure expandedMethods is a Set
	const methodsSet =
		expandedMethods instanceof Set
			? expandedMethods
			: new Set(Array.isArray(expandedMethods) ? expandedMethods : []);

	const codelistKey = getExpansionKey(variable.OID, EXPANSION_TYPE.CODELIST);
	return methodsSet.has(codelistKey);
}

/**
 * Toggle method expansion state
 */
export function toggleMethodExpansion(variable: itemRef, datasetName: string): void {
	if (!variable.MethodOID || !variable.OID) return;

	const methodKey = getExpansionKey(variable.OID, EXPANSION_TYPE.METHOD, variable.MethodOID);
	console.log(`Toggling method: ${methodKey}`);

	// Log the state before toggle
	const beforeState = metadataViewStore.getDatasetState(datasetName);
	const beforeExpanded =
		beforeState.expandedMethods instanceof Set ? Array.from(beforeState.expandedMethods) : [];
	console.log(`Before toggle, expanded methods:`, beforeExpanded);

	// Toggle the method
	metadataViewStore.toggleMethod(datasetName, methodKey);

	// Log the state after toggle
	const afterState = metadataViewStore.getDatasetState(datasetName);
	const afterExpanded =
		afterState.expandedMethods instanceof Set ? Array.from(afterState.expandedMethods) : [];
	console.log(`After toggle, expanded methods:`, afterExpanded);
}

/**
 * Toggle codelist expansion state
 */
export function toggleCodelistExpansion(variable: itemRef, datasetName: string): void {
	if (!variable.OID) return;

	const codelistKey = getExpansionKey(variable.OID, EXPANSION_TYPE.CODELIST);
	console.log(`Toggling codelist expansion: ${codelistKey}`);

	// Log the state before toggle
	const beforeState = metadataViewStore.getDatasetState(datasetName);
	const beforeExpanded =
		beforeState.expandedMethods instanceof Set ? Array.from(beforeState.expandedMethods) : [];
	console.log(`Before toggle, expanded codelists:`, beforeExpanded);

	// Toggle the codelist
	metadataViewStore.toggleMethod(datasetName, codelistKey);

	// Log the state after toggle
	const afterState = metadataViewStore.getDatasetState(datasetName);
	const afterExpanded =
		afterState.expandedMethods instanceof Set ? Array.from(afterState.expandedMethods) : [];
	console.log(`After toggle, expanded codelists:`, afterExpanded);
}

/**
 * Check if any expansion (method or codelist) is active
 */
export function isAnyExpansionActive(
	variable: itemRef,
	datasetName: string,
	expandedMethods: Set<string> | string[] | undefined
): boolean {
	const hasMethodExpanded = variable.MethodOID
		? isMethodExpanded(variable, datasetName, expandedMethods)
		: false;

	const hasCodelistExpanded = isCodelistExpanded(variable, datasetName, expandedMethods);

	return hasMethodExpanded || hasCodelistExpanded;
}
