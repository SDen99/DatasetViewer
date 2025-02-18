import { metadataViewStore } from '$lib/core/stores/MetadataViewStore.svelte';
import type { itemRef } from '$lib/core/processors/defineXML/types';

export function getMethodKey(variableOID: string, methodOID: string): string {
	return `${variableOID}-${methodOID}`;
}

export function isMethodExpanded(
	variable: itemRef,
	datasetName: string,
	expandedMethods: Set<string> | string[] | undefined
): boolean {
	if (!variable.MethodOID) return false;

	// Ensure expandedMethods is a Set
	const methodsSet =
		expandedMethods instanceof Set
			? expandedMethods
			: new Set(Array.isArray(expandedMethods) ? expandedMethods : []);

	const methodKey = getMethodKey(variable.OID || '', variable.MethodOID);
	return methodsSet.has(methodKey);
}

export function toggleMethodExpansion(variable: itemRef, datasetName: string): void {
	if (!variable.MethodOID) return;

	const methodKey = getMethodKey(variable.OID || '', variable.MethodOID);
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
