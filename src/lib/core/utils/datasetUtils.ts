import type { ItemGroup } from '$lib/core/processors/defineXML/types';
import type { ParsedDefineXML } from '$lib/core/processors/defineXML/types';

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

export function normalizeDatasetId(name: string): string {
	// Remove file extension and convert to uppercase
	return name
		.replace(/\.(sas7bdat|xml)$/i, '')
		.toUpperCase()
		.trim();
}

export function findDatasetByName(
	datasets: Record<string, any>,
	name: string,
	defineData?: {
		SDTM: ParsedDefineXML | null;
		ADaM: ParsedDefineXML | null;
	}
): any {
	const normalizedName = normalizeDatasetId(name);

	// First try exact match in actual datasets
	if (datasets[name]) {
		return datasets[name];
	}

	// Then try normalized match in actual datasets
	const normalizedMatch = Object.entries(datasets).find(
		([key]) => normalizeDatasetId(key) === normalizedName
	)?.[1];
	if (normalizedMatch) {
		return normalizedMatch;
	}

	// Finally check metadata-only datasets
	if (defineData) {
		const sdtmMatch = defineData.SDTM?.itemGroups?.find(
			(g) => normalizeDatasetId(g.Name || '') === normalizedName
		);
		const adamMatch = defineData.ADaM?.itemGroups?.find(
			(g) => normalizeDatasetId(g.Name || '') === normalizedName
		);

		if (sdtmMatch || adamMatch) {
			return {
				fileName: name,
				isMetadataOnly: true,
				metadata: sdtmMatch || adamMatch
			};
		}
	}

	return null;
}
