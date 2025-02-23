import { parseDefineXML } from '$lib/core/processors/defineXML/ParseDefineXML';
import { FileType, type FileProcessor, type ValidationResult } from '$lib/core/types/fileTypes';
import type { DatasetLoadingState } from '$lib/core/types/types';
import type { ProcessingResult } from '$lib/core/processors/types';
import { uiStore } from '$lib/core/stores/UIStore.svelte';

export class DefineXMLProcessor implements FileProcessor {
	validateFile(file: File): ValidationResult {
		if (!file.name.toLowerCase().endsWith('.xml')) {
			return {
				valid: false,
				error: `File ${file.name} is not a valid Define-XML file`,
				fileType: FileType.DEFINEXML
			};
		}
		return { valid: true, fileType: FileType.DEFINEXML };
	}

	async processFile(
		file: File,
		onProgress?: (state: DatasetLoadingState) => void
	): Promise<ProcessingResult> {
		try {
			console.log('[DefineXMLProcessor] Starting to process file:', file.name);

			if (onProgress) {
				onProgress({
					status: 'processing',
					fileName: file.name,
					progress: 0,
					totalSize: file.size,
					loadedSize: 0
				});
			}

			const text = await file.text();
			console.log('[DefineXMLProcessor] File text loaded, length:', text.length);

			const defineData = await parseDefineXML(text);
			console.log('[DefineXMLProcessor] Parse complete:', {
				hasMetaData: 'MetaData' in defineData,
				metaDataOID: defineData.MetaData?.OID,
				itemGroupsCount: defineData.ItemGroups?.length,
				itemGroups: defineData.ItemGroups?.map((g) => g.Name)
			});

			// Add result details for consistency with other processors
			const result = {
				data: defineData,
				success: true,
				ADaM: defineData.MetaData.OID?.includes('ADaM') || false,
				SDTM: defineData.MetaData.OID?.includes('SDTM') || false,
				details: {
					num_rows: defineData.ItemGroups?.length || 0,
					num_columns: defineData.ItemDefs?.length || 0,
					columns: ['Name', 'Label', 'Type'], // Add relevant columns
					dtypes: {},
					summary: {}
				}
			};

			console.log('[DefineXMLProcessor] Processing result:', result);
			return result;
		} catch (error) {
			console.error('[DefineXMLProcessor] Processing error:', error);
			throw error;
		}
	}
}
