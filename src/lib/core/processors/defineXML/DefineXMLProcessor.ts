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
			console.log('Starting file processing:', file.name);

			if (onProgress) {
				onProgress({
					status: 'processing',
					fileName: file.name,
					progress: 0,
					totalSize: file.size,
					loadedSize: 0
				});
			}

			console.log('Reading file text...');
			const text = await file.text();
			console.log('File text read, length:', text.length);

			console.log('Parsing Define XML...');
			const defineData = await parseDefineXML(text);
			console.log('Parse complete, checking structure:', {
				hasMetaData: 'MetaData' in defineData,
				hasItemGroups: 'ItemGroups' in defineData
			});

			// ... rest of the code ...
		} catch (error) {
			console.error('Processing error:', error);
			throw error;
		}
	}
}
