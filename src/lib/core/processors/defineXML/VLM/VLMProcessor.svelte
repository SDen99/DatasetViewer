<script lang="ts" module>
	import type { ParsedDefineXML } from '$lib/types/define-xml';
	import type { ProcessedVLM } from '$lib/types/VLMtypes/VLMTypes';
	import { processValueLevelMetadata } from '$lib/core/processors/defineXML/VLM/vlm-processor';
	import { normalizeDatasetId } from '$lib/core/utils/datasetUtils';

	/**
	 * Creates a VLM processor with state management for
	 * processing and displaying Value Level Metadata
	 */
	export function createVLMProcessor() {
		// State variables
		let vlmData = $state<ProcessedVLM>({
			dataset: '',
			variables: new Map()
		});

		let status = $state<'idle' | 'processing' | 'error' | 'complete'>('idle');
		let error = $state<string | null>(null);
		let processingStats = $state<{
			totalVariables: number;
			totalParameters: number;
			processingTimeMs: number;
		}>({
			totalVariables: 0,
			totalParameters: 0,
			processingTimeMs: 0
		});

		/**
		 * Process Define-XML to extract value level metadata for a dataset
		 * @param define The parsed Define-XML document
		 * @param datasetName The name of the dataset to process
		 */
		function process(define: ParsedDefineXML | null, datasetName: string) {
			if (!define || !datasetName) {
				status = 'idle';
				error = null;
				return;
			}

			try {
				// Start processing
				const startTime = performance.now();
				status = 'processing';
				error = null;

				console.log('Processing VLM for:', {
					datasetName,
					valueListDefs: define.ValueListDefs?.length,
					whereClauses: define.WhereClauseDefs?.length
				});

				// Call the core processing logic
				const result = processValueLevelMetadata(define, datasetName);

				// Calculate processing statistics
				const endTime = performance.now();
				const totalParameters = Array.from(result.variables.values()).reduce(
					(total, variable) => total + variable.valueListDef.ItemRefs.length,
					0
				);

				// Update state
				vlmData = result;
				status = 'complete';
				processingStats = {
					totalVariables: result.variables.size,
					totalParameters,
					processingTimeMs: Math.round(endTime - startTime)
				};

				console.log('VLM Processing Complete:', {
					dataset: result.dataset,
					variableCount: result.variables.size,
					parameterCount: totalParameters,
					processingTime: `${Math.round(endTime - startTime)}ms`
				});
			} catch (err) {
				console.error('VLM Processing Error:', err);
				error = err instanceof Error ? err.message : 'Unknown error';
				status = 'error';
			}
		}

		/**
		 * Retrieve variable-specific VLM data
		 * @param variableName The name of the variable to retrieve data for
		 * @returns The VLM data for the specified variable, or null if not found
		 */
		function getVariableData(variableName: string) {
			return vlmData.variables.get(variableName) || null;
		}

		/**
		 * Retrieve parameter-specific ItemRef data for a variable
		 * @param variableName The name of the variable
		 * @param paramcd The parameter code to retrieve data for
		 * @returns The ItemRef for the specified parameter, or null if not found
		 */
		function getParameterData(variableName: string, paramcd: string) {
			const variable = vlmData.variables.get(variableName);
			if (!variable) return null;

			return variable.valueListDef.ItemRefs.find((item) => item.paramcd === paramcd) || null;
		}

		/**
		 * Get a list of all parameters in the dataset
		 * @returns Array of parameter codes
		 */
		function getAllParameters(): string[] {
			const paramVariable = vlmData.variables.get('PARAMCD');
			if (!paramVariable) return [];

			return paramVariable.valueListDef.ItemRefs.map((item) => item.paramcd).filter(
				(paramcd) => paramcd !== '*'
			);
		}

		/**
		 * Get a list of all variables that have VLM
		 * @returns Array of variable names
		 */
		function getAllVariables(): string[] {
			return Array.from(vlmData.variables.keys());
		}

		/**
		 * Check if a variable has value level metadata
		 * @param variableName The name of the variable to check
		 * @returns True if the variable has VLM, false otherwise
		 */
		function hasVLM(variableName: string): boolean {
			const variable = vlmData.variables.get(variableName);
			return !!variable && variable.valueListDef.ItemRefs.length > 0;
		}

		/**
		 * Check if a parameter exists in the VLM
		 * @param paramcd The parameter code to check
		 * @returns True if the parameter exists, false otherwise
		 */
		function hasParameter(paramcd: string): boolean {
			const paramVariable = vlmData.variables.get('PARAMCD');
			if (!paramVariable) return false;

			return paramVariable.valueListDef.ItemRefs.some((item) => item.paramcd === paramcd);
		}

		/**
		 * Get a summary of VLM coverage for the dataset
		 * @returns Object with summary information
		 */
		function getSummary() {
			return {
				dataset: vlmData.dataset,
				variableCount: vlmData.variables.size,
				parameterCount: processingStats.totalParameters,
				processingTime: `${processingStats.processingTimeMs}ms`,
				status,
				hasError: status === 'error',
				errorMessage: error
			};
		}

		// Public API
		return {
			process,
			vlmData: () => vlmData,
			status: () => status,
			error: () => error,
			stats: () => processingStats,
			getVariableData,
			getParameterData,
			hasVLM,
			hasParameter,
			getAllParameters,
			getAllVariables,
			getSummary
		};
	}

	/**
	 * Diagnostic function to examine Define-XML structure
	 * @param define The parsed Define-XML document
	 * @param datasetName The name of the dataset to examine
	 */
	export function debugDefineStructure(define: ParsedDefineXML, datasetName: string) {
		const normalizedDatasetName = normalizeDatasetId(datasetName);

		console.log('=== DEBUGGING DEFINE STRUCTURE ===');

		// 1. Log all ItemDefs for this dataset
		const datasetItems = define.ItemDefs.filter((item) => {
			const parts = item.OID?.split('.');
			return parts?.[0] === 'IT' && normalizeDatasetId(parts?.[1] || '') === normalizedDatasetName;
		});

		console.log(`Found ${datasetItems.length} ItemDefs for dataset ${datasetName}`);
		console.log(
			datasetItems.map((item) => {
				const parts = item.OID?.split('.');
				return {
					variable: parts?.[2],
					OID: item.OID,
					hasCodeList: !!item.CodeListOID,
					description:
						item.Description?.substring(0, 50) + (item.Description?.length > 50 ? '...' : '')
				};
			})
		);

		// 2. Log all ValueListDefs
		const valueListDefs = define.ValueListDefs.filter((vl) => {
			const parts = vl.OID?.split('.');
			return parts?.[0] === 'VL' && normalizeDatasetId(parts?.[1] || '') === normalizedDatasetName;
		});

		console.log(`Found ${valueListDefs.length} ValueListDefs for dataset ${datasetName}`);
		console.log(
			valueListDefs.map((vl) => {
				const parts = vl.OID?.split('.');
				return {
					variable: parts?.[2],
					OID: vl.OID,
					itemRefCount: vl.ItemRefs?.length || 0
				};
			})
		);

		// 3. Log all WhereClauseDefs for this dataset (those that reference this dataset)
		const relevantWhereClauses = define.WhereClauseDefs.filter((wc) =>
			wc.RangeChecks.some((check) => {
				const parts = check.ItemOID.split('.');
				return parts[0] === 'IT' && normalizeDatasetId(parts[1]) === normalizedDatasetName;
			})
		);

		console.log(`Found ${relevantWhereClauses.length} WhereClauseDefs for dataset ${datasetName}`);
		console.log(
			relevantWhereClauses.map((wc) => {
				return {
					OID: wc.OID,
					rangeChecks: wc.RangeChecks.map((check) => {
						const parts = check.ItemOID.split('.');
						return {
							variable: parts[2],
							comparator: check.Comparator,
							values: check.CheckValues
						};
					})
				};
			})
		);

		console.log('=== END DEBUGGING ===');
	}
</script>
