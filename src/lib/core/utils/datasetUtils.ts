import type { ItemGroup } from '$lib/core/processors/defineXML/types';
import type { Dataset } from '../types/types';

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

export function normalizeDatasetId(name: string | null | undefined): string {
	if (!name) return '';

	// Remove file extension and convert to uppercase
	return name
		.replace(/\.(sas7bdat|xml)$/i, '')
		.toUpperCase()
		.trim();
}

export function findDatasetByName(
	datasets: Record<string, Dataset>,
	name: string,
	defineXmlDatasets: any
): Dataset | null {
	const normalizedName = normalizeDatasetId(name);

	// Log the actual datasets for debugging
	console.log('Finding dataset:', {
		normalizedName,
		availableDatasets: Object.keys(datasets).map((k) => normalizeDatasetId(k))
	});

	// Search through datasets with normalized keys
	for (const [key, value] of Object.entries(datasets)) {
		if (normalizeDatasetId(key) === normalizedName) {
			return value;
		}
	}

	return null;
}
