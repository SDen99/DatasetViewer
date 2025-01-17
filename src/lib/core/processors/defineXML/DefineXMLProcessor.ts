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
			// Start processing
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
			const defineData = await parseDefineXML(text);

			// Update progress
			if (onProgress) {
				onProgress({
					status: 'complete',
					fileName: file.name,
					progress: 100,
					totalSize: file.size,
					loadedSize: file.size
				});
			}

			uiStore.setDefineXMLType(
				defineData.metaData.OID?.includes('SDTM') || false,
				defineData.metaData.OID?.includes('ADaM') || false
			);

			return {
				data: defineData,
				success: true,
				ADaM: defineData.metaData.OID?.includes('ADaM') || false,
				SDTM: defineData.metaData.OID?.includes('SDTM') || false
			};
		} catch (error) {
			if (onProgress) {
				onProgress({
					status: 'error',
					fileName: file.name,
					progress: 0,
					totalSize: file.size,
					loadedSize: 0,
					error: error instanceof Error ? error.message : 'Error processing Define-XML file'
				});
			}
			throw error;
		}
	}
}
