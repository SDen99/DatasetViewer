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
	datasets: Record<string, any>,
	name: string,
	defineXmlDatasets: any
): Dataset | null {
	const normalizedName = normalizeDatasetId(name);

	// First try direct lookup
	const dataset = datasets[name];
	if (dataset) return dataset;

	// Then try normalized lookup
	for (const [key, value] of Object.entries(datasets)) {
		if (normalizeDatasetId(key) === normalizedName) {
			return value;
		}
	}

	return null;
}
