import { parseDefineXML } from '$lib/core/processors/defineXML/ParseDefineXML';
import { FileType, type FileProcessor, type ValidationResult } from '$lib/core/types/fileTypes';
import type { DatasetLoadingState } from '$lib/core/types/types';
import type { ProcessingResult } from '$lib/core/processors/types';
import { graphXML } from '$lib/utils/graphXML';

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

			if (onProgress) {
				onProgress({
					status: 'processing',
					fileName: file.name,
					progress: 30,
					totalSize: file.size,
					loadedSize: text.length
				});
			}

			const defineData = await parseDefineXML(text);
			console.log('[DefineXMLProcessor] Parse complete:', {
				hasMetaData: 'MetaData' in defineData,
				metaDataOID: defineData.MetaData?.OID,
				itemGroupsCount: defineData.ItemGroups?.length,
				itemGroups: defineData.ItemGroups?.map((g) => g.Name)
			});

			if (onProgress) {
				onProgress({
					status: 'processing',
					fileName: file.name,
					progress: 70,
					totalSize: file.size,
					loadedSize: text.length
				});
			}

			// Generate graph data using graphXML
			let graphData = null;
			try {
				graphData = graphXML({
					itemGroups: defineData.ItemGroups || [],
					itemDefs: defineData.ItemDefs || [],
					methods: defineData.Methods || [],
					comments: defineData.Comments || [],
					CodeLists: defineData.CodeLists || [],
					standards: defineData.Standards || [],
					itemRefs: defineData.ItemRefs || [],
					valueListDefs: defineData.ValueListDefs || [],
					whereClauseDefs: defineData.WhereClauseDefs || []
				});
				console.log('[DefineXMLProcessor] Graph data generated:', {
					nodeCount: graphData.nodes.length,
					linkCount: graphData.links.length
				});
			} catch (graphError) {
				console.error('[DefineXMLProcessor] Error generating graph:', graphError);
				// We continue processing even if graph generation fails
			}

			if (onProgress) {
				onProgress({
					status: 'processing',
					fileName: file.name,
					progress: 90,
					totalSize: file.size,
					loadedSize: text.length
				});
			}

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
				},
				// Add graph data if generation was successful
				graphData: graphData,
				// Add processing stats
				processingTime: performance.now() // Will be converted to elapsed time in FileImportManager
			};

			console.log('[DefineXMLProcessor] Processing result:', {
				success: result.success,
				ADaM: result.ADaM,
				SDTM: result.SDTM,
				hasGraphData: !!result.graphData
			});

			return result;
		} catch (error) {
			console.error('[DefineXMLProcessor] Processing error:', error);
			throw error;
		}
	}
}
