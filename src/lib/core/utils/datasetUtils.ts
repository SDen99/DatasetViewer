import type { ItemGroup } from '$lib/core/processors/defineXML/types';

export function isDatasetLoaded(datasetName: string, loadedDatasets: Set<string>): boolean {
	return loadedDatasets.has(datasetName);
}

export function getDisplayName(dataset: ItemGroup): string {
	return dataset.SASDatasetName || dataset.Name || '';
}

export function getDatasetMetadata(dataset: ItemGroup) {
	return {
		itemCount: dataset.ItemRefs?.length || 0,
		category: dataset.Class || undefined
	};
}
