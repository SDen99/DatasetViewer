// src/lib/core/processors/defineXML/VLMProcessingLogic.ts
import type {
	WhereClauseDef,
	RangeCheck,
	MethodInfo,
	ValueListDef,
	ParsedDefineXML,
	ItemDef,
	Method
} from '$lib/types/define-xml';
import { normalizeDatasetId } from '$lib/core/utils/datasetUtils';
import { methodUtils } from '$lib/utils/defineXML/methodUtils';

export interface CodeListInfo {
	ordinal: number;
	codedValue: string;
	decode: string;
	isExternal: boolean;
	externalCodeList?: {
		dictionary: string;
		version: string;
	};
}

export interface OriginInfo {
	type: string;
	source: string | null;
	description?: string | null;
	translatedText?: string | null;
}

export interface VLMItemRef {
	paramcd: string;
	paramInfo?: CodeListInfo;
	whereClause?: {
		comparator: RangeCheck['Comparator'];
		checkValues: string[];
		whereClauseOID: string;
		OID: string;
		source: {
			domain: string;
			variable: string;
		};
	};
	methodOID?: string;
	valueListOID?: string;
	OID?: string;
	method?: MethodInfo;
	origin?: OriginInfo;
	itemDescription?: string | null;
	mandatory: boolean;
	orderNumber: number;
	sources?: {
		[variable: string]: {
			domain?: string;
			variable?: string;
			type?: string;
			value?: string;
		};
	};
	codelist?: {
		OID: string;
		name?: string;
		items?: Array<{
			codedValue: string;
			decode: string;
			isExtended?: boolean;
		}>;
	};
}

export interface VLMVariable {
	name: string;
	valueListDef: {
		OID: string;
		ItemRefs: VLMItemRef[];
	};
	origin?: string;
	codeList?: string;
	mightCauseDuplicates?: boolean; // Added for duplicate detection
	duplicateReason?: string; // Reason this variable might cause duplicates
}

export interface ProcessedVLM {
	dataset: string;
	variables: Map<string, VLMVariable>;
	// For duplicate detection
	potentialDuplicateCauses?: Array<{
		variable: string;
		reason: string;
		affectedParamcds: string[];
		severity: 'high' | 'medium' | 'low';
	}>;
	hasSpecialVariables?: {
		hasDTYPE: boolean;
		hasAVISITN: boolean;
		hasAVALCAT: boolean;
		hasASEQ: boolean;
		hasCRIT: boolean;
		hasOTHER: boolean;
	};
}

interface WhereClauseResult {
	paramcd: string[];
	conditions: {
		variable: string;
		comparator: RangeCheck['Comparator'];
		values: string[];
	}[];
}

function buildParamcdMapping(define: ParsedDefineXML, datasetName: string): Map<string, string> {
	const paramcdToParamMap = new Map<string, string>();
	const normalizedDatasetName = normalizeDatasetId(datasetName);

	const paramcdItemDef = define.ItemDefs?.find((def) => {
		const parts = def.OID?.split('.');
		return (
			parts?.[0] === 'IT' &&
			normalizeDatasetId(parts?.[1] || '') === normalizedDatasetName &&
			parts?.[2] === 'PARAMCD'
		);
	});

	if (paramcdItemDef?.CodeListOID) {
		const codeList = define.CodeLists?.find((cl) => cl.OID === paramcdItemDef.CodeListOID);
		if (codeList?.CodeListItems) {
			codeList.CodeListItems.forEach((item) => {
				if (item.CodedValue && item.Decode?.TranslatedText) {
					paramcdToParamMap.set(item.CodedValue, item.Decode.TranslatedText);
				}
			});
		}
	}

	return paramcdToParamMap;
}

function findValueListDefs(define: ParsedDefineXML, datasetName: string): ValueListDef[] {
	const normalizedDatasetName = normalizeDatasetId(datasetName);
	const uniqueOIDs = new Set();
	return (define.ValueListDefs || []).filter((def) => {
		const parts = def.OID?.split('.') || [];
		if (parts[0] === 'VL' && normalizeDatasetId(parts[1] || '') === normalizedDatasetName) {
			if (!uniqueOIDs.has(def.OID)) {
				uniqueOIDs.add(def.OID);
				return true;
			}
		}
		return false;
	});
}

function processWhereClause(
	whereClauseOID: string,
	whereClauseDefs: WhereClauseDef[],
	datasetName: string
): WhereClauseResult | null {
	// Find the matching WhereClauseDef
	const whereClause = whereClauseDefs.find((def) => def.OID === whereClauseOID);
	if (!whereClause) {
		console.warn(`No WhereClauseDef found for OID: ${whereClauseOID}`);
		return null;
	}

	// Initialize result
	const result: WhereClauseResult = {
		paramcd: [],
		conditions: []
	};

	// Process all RangeChecks (these are combined with AND logic per spec)
	whereClause.RangeChecks.forEach((check) => {
		// Extract dataset and variable from ItemOID (format: IT.{dataset}.{variable})
		const itemParts = check.ItemOID.split('.');
		if (itemParts.length !== 3) {
			console.warn(`Invalid ItemOID format in WhereClauseDef ${whereClauseOID}: ${check.ItemOID}`);
			return;
		}

		const [prefix, checkDataset, variable] = itemParts;

		// Validate this RangeCheck belongs to our dataset
		if (normalizeDatasetId(checkDataset) !== normalizeDatasetId(datasetName)) {
			console.warn(
				`Dataset mismatch in WhereClauseDef ${whereClauseOID}: expected ${datasetName}, got ${checkDataset}`
			);
			return;
		}

		// Build condition
		const condition = {
			variable,
			comparator: check.Comparator,
			values: check.CheckValues
		};

		// If this is a PARAMCD condition, add to paramcd array
		if (variable === 'PARAMCD') {
			if (check.Comparator === 'EQ') {
				result.paramcd.push(...check.CheckValues);
			} else if (check.Comparator === 'IN') {
				result.paramcd.push(...check.CheckValues);
			}
			// Note: We ignore NE and NOTIN for PARAMCD as they're typically not used for direct mapping
		}

		result.conditions.push(condition);
	});

	// If we didn't find any valid conditions, return null
	if (result.conditions.length === 0) {
		console.warn(`No valid conditions found in WhereClauseDef ${whereClauseOID}`);
		return null;
	}

	return result;
}

function processOriginInfo(itemDef: ItemDef): OriginInfo | undefined {
	if (!itemDef.OriginType && !itemDef.Origin) return undefined;

	return {
		type: itemDef.OriginType || '',
		source: itemDef.Origin || null,
		description: itemDef.Description || null,
		translatedText: (itemDef as any).OriginTranslatedText || null
	};
}

function processMethod(methodOID: string, methods: Method[]): MethodInfo | undefined {
	const method = methods.find((m) => m.OID === methodOID);
	if (!method) return undefined;

	return {
		Type: method.Type || null,
		Description: method.Description || null,
		Document: method.Document || undefined,
		TranslatedText: method.TranslatedText || null
	};
}

function processValueListDefs(
	valueListDef: ValueListDef,
	define: ParsedDefineXML,
	paramcdToParamMap: Map<string, string>,
	datasetName: string
): VLMItemRef[] {
	const itemRefs: VLMItemRef[] = [];

	if (!valueListDef.ItemRefs) {
		console.log('No ItemRefs found in ValueListDef');
		return itemRefs;
	}

	valueListDef.ItemRefs.forEach((itemRef) => {
		if (!itemRef.WhereClauseOID) {
			console.log('No WhereClauseOID found');
			return;
		}

		const whereClauseResult = processWhereClause(
			itemRef.WhereClauseOID,
			define.WhereClauseDefs || [],
			datasetName
		);

		if (!whereClauseResult || whereClauseResult.paramcd.length === 0) {
			console.log(`No PARAMCD found for WhereClauseOID: ${itemRef.WhereClauseOID}`);
			return;
		}

		const itemDef = define.ItemDefs?.find((def) => def.OID === itemRef.OID);
		if (!itemDef) {
			console.warn(`ItemDef not found for OID: ${itemRef.OID}`);
			return;
		}

		let codelistInfo: any | undefined;
		if (itemDef.CodeListOID) {
			const codeList = define.CodeLists?.find((cl) => cl.OID === itemDef.CodeListOID);
			if (codeList) {
				codelistInfo = {
					OID: codeList.OID,
					name: codeList.Name,
					items: codeList.CodeListItems?.map((item) => ({
						codedValue: item.CodedValue,
						decode: item.Decode?.TranslatedText || '',
						isExtended: item.ExtendedValue === true
					}))
				};
			}
		}

		// Create an ItemRef for each PARAMCD value
		whereClauseResult.paramcd.forEach((paramcd) => {
			const vlmItemRef: VLMItemRef = {
				paramcd,
				paramInfo: {
					ordinal: parseInt(itemRef.OrderNumber || '0', 10),
					codedValue: paramcd,
					decode: paramcdToParamMap.get(paramcd) || '',
					isExternal: false
				},
				whereClause: {
					comparator: whereClauseResult.conditions[0].comparator,
					checkValues: whereClauseResult.conditions[0].values,
					whereClauseOID: itemRef.WhereClauseOID || '',
					OID: itemRef.OID || '',
					source: {
						domain: datasetName,
						variable: whereClauseResult.conditions[0].variable
					}
				},
				method: itemRef.MethodOID
					? methodUtils.processMethod(itemRef.MethodOID, define.Methods || [])
					: undefined,
				methodOID: itemRef.MethodOID || undefined,
				valueListOID: valueListDef.OID || undefined,
				OID: itemDef.OID || undefined,
				codelist: codelistInfo,
				origin: processOriginInfo(itemDef),
				itemDescription: itemDef.Description || null,
				mandatory: itemRef.Mandatory === 'Yes',
				orderNumber: parseInt(itemRef.OrderNumber || '0', 10),
				sources: {}
			};

			itemRefs.push(vlmItemRef);
		});
	});

	return itemRefs;
}

function getOriginInfo(itemDef: ItemDef): OriginInfo {
	return {
		type: itemDef.OriginType || '',
		source: itemDef.OriginSource || null,
		description: itemDef.Description || null,
		translatedText: (itemDef as any).OriginTranslatedText || null // Type assertion if property doesn't exist in interface
	};
}

export function processValueLevelMetadata(
	define: ParsedDefineXML,
	datasetName: string
): ProcessedVLM {
	console.log('Starting VLM processing:', {
		datasetName,
		defineKeys: Object.keys(define)
	});

	const result: ProcessedVLM = {
		dataset: datasetName,
		variables: new Map()
	};

	const paramcdToParamMap = buildParamcdMapping(define, datasetName);
	console.log('PARAMCD mapping:', Array.from(paramcdToParamMap.entries()));

	const valueListDefs = findValueListDefs(define, datasetName);
	console.log('Found ValueListDefs:', valueListDefs);
	valueListDefs.forEach((valueListDef) => {
		if (!valueListDef.OID) return;

		const variable = valueListDef.OID.split('.')[2];
		if (!variable) return;

		let vlmVariable = result.variables.get(variable);
		console.log('Processing VLM Variable:', {
			variable,
			existing: !!vlmVariable,
			itemRefs: valueListDef.ItemRefs?.length || 0
		});

		if (!vlmVariable) {
			vlmVariable = {
				name: variable,
				valueListDef: {
					OID: valueListDef.OID,
					ItemRefs: []
				}
			};
			result.variables.set(variable, vlmVariable);
		}

		const itemRefs = processValueListDefs(valueListDef, define, paramcdToParamMap, datasetName);
		console.log('Processed ItemRefs:', {
			variable,
			count: itemRefs.length,
			sample: itemRefs[0]
		});

		vlmVariable.valueListDef.ItemRefs.push(...itemRefs);
	});

	// For duplicate detection, identify variables that might cause duplicate records
	result.potentialDuplicateCauses = detectPotentialDuplicateCauses(define, datasetName);

	// Update the hasSpecialVariables flags
	result.hasSpecialVariables = {
		hasDTYPE: false,
		hasAVISITN: false,
		hasAVALCAT: false,
		hasASEQ: false,
		hasCRIT: false,
		hasOTHER: false
	};

	if (result.potentialDuplicateCauses) {
		result.potentialDuplicateCauses.forEach((cause) => {
			if (cause.variable === 'DTYPE') result.hasSpecialVariables!.hasDTYPE = true;
			else if (cause.variable === 'AVISITN') result.hasSpecialVariables!.hasAVISITN = true;
			else if (cause.variable.startsWith('AVALCAT')) result.hasSpecialVariables!.hasAVALCAT = true;
			else if (cause.variable === 'ASEQ') result.hasSpecialVariables!.hasASEQ = true;
			else if (cause.variable.startsWith('CRIT')) result.hasSpecialVariables!.hasCRIT = true;
			else result.hasSpecialVariables!.hasOTHER = true;
		});
	}

	return result;
}

/**
 * Analyzes the Define.xml structure to detect variables that might cause duplicates
 * for parameter-level data
 */
function detectPotentialDuplicateCauses(
	define: ParsedDefineXML,
	datasetName: string
): Array<{
	variable: string;
	reason: string;
	affectedParamcds: string[];
	severity: 'high' | 'medium' | 'low';
}> {
	const potentialDuplicates: Array<{
		variable: string;
		reason: string;
		affectedParamcds: string[];
		severity: 'high' | 'medium' | 'low';
	}> = [];

	const normalizedDatasetName = normalizeDatasetId(datasetName);

	// 1. Look for DTYPE variable in the dataset
	const dtypeItemDef = define.ItemDefs?.find((def) => {
		const parts = def.OID?.split('.');
		return (
			parts?.[0] === 'IT' &&
			normalizeDatasetId(parts?.[1] || '') === normalizedDatasetName &&
			parts?.[2] === 'DTYPE'
		);
	});

	if (dtypeItemDef) {
		// Check if DTYPE has associated methods or codes that indicate derivation
		const dtypeInfo = {
			variable: 'DTYPE',
			reason: 'Derivation type variable that explicitly indicates alternative derived records',
			affectedParamcds: [] as string[], // We'll fill this from the value level metadata
			severity: 'high' as const
		};

		// Check for codelist to get possible DTYPE values
		if (dtypeItemDef.CodeListOID) {
			const codeList = define.CodeLists?.find((cl) => cl.OID === dtypeItemDef.CodeListOID);
			if (codeList?.CodeListItems) {
				const values = codeList.CodeListItems.map((item) => item.CodedValue).join(', ');
				dtypeInfo.reason += ` with values: ${values}`;
			}
		}

		potentialDuplicates.push(dtypeInfo);
	}

	// 2. Look for AVISITN and check for windowing rules
	// Fixed to use MethodOID if it exists or a more generic approach if not
	const avisitnItemDef = define.ItemDefs?.find((def) => {
		const parts = def.OID?.split('.');
		return (
			parts?.[0] === 'IT' &&
			normalizeDatasetId(parts?.[1] || '') === normalizedDatasetName &&
			parts?.[2] === 'AVISITN'
		);
	});

	if (avisitnItemDef) {
		// Try to determine if it has windowing rules from any information available
		let hasWindowingRules = false;

		// Check Description for windowing references
		let itemDefDesc = '';
		if (avisitnItemDef.Description) {
			if (typeof avisitnItemDef.Description === 'string') {
				itemDefDesc = avisitnItemDef.Description;
			} else if (typeof avisitnItemDef.Description === 'object') {
				// Handle the case where Description might be an object with TranslatedText
				const descObj = avisitnItemDef.Description as any;
				if (descObj && descObj.TranslatedText) {
					itemDefDesc = descObj.TranslatedText;
				}
			}
		}
		if (
			itemDefDesc.toLowerCase().includes('window') ||
			itemDefDesc.toLowerCase().includes('visit') ||
			itemDefDesc.toLowerCase().includes('time point')
		) {
			hasWindowingRules = true;
		}

		// Look for linked methods
		// This needs to be adapted to how methods are linked in your schema
		const methodOID = (avisitnItemDef as any).MethodOID;
		if (methodOID) {
			const method = define.Methods?.find((m) => m.OID === methodOID);
			const methodText = method?.Description || method?.TranslatedText || '';
			if (
				methodText.toLowerCase().includes('window') ||
				methodText.toLowerCase().includes('visit') ||
				methodText.toLowerCase().includes('time point')
			) {
				hasWindowingRules = true;
			}
		}

		if (hasWindowingRules) {
			potentialDuplicates.push({
				variable: 'AVISITN',
				reason:
					'Analysis visit variable with windowing rules that could create duplicate records for time points',
				affectedParamcds: [],
				severity: 'medium'
			});
		}
	}

	// 3. Look for AVALCAT variables
	const avalcatItemDefs =
		define.ItemDefs?.filter((def) => {
			const parts = def.OID?.split('.');
			return (
				parts?.[0] === 'IT' &&
				normalizeDatasetId(parts?.[1] || '') === normalizedDatasetName &&
				parts?.[2]?.startsWith('AVALCAT')
			);
		}) || [];

	if (avalcatItemDefs.length > 0) {
		potentialDuplicates.push({
			variable: 'AVALCATx',
			reason: `Analysis value category variables (${avalcatItemDefs.map((d) => d.OID?.split('.')?.[2]).join(', ')}) that might create categorized duplicates of AVAL`,
			affectedParamcds: [],
			severity: 'medium'
		});
	}

	// 4. Look for criterion flags
	const critItemDefs =
		define.ItemDefs?.filter((def) => {
			const parts = def.OID?.split('.');
			return (
				parts?.[0] === 'IT' &&
				normalizeDatasetId(parts?.[1] || '') === normalizedDatasetName &&
				parts?.[2]?.startsWith('CRIT')
			);
		}) || [];

	if (critItemDefs.length > 0) {
		potentialDuplicates.push({
			variable: 'CRITx',
			reason: `Criterion flags (${critItemDefs.map((d) => d.OID?.split('.')?.[2]).join(', ')}) that might create filtered duplicates`,
			affectedParamcds: [],
			severity: 'low'
		});
	}

	// 5. Check special flags like ONTRTFL, POSTTRTFL
	const specialFlags = ['ONTRTFL', 'POSTTRTFL'];
	for (const flag of specialFlags) {
		const flagItemDef = define.ItemDefs?.find((def) => {
			const parts = def.OID?.split('.');
			return (
				parts?.[0] === 'IT' &&
				normalizeDatasetId(parts?.[1] || '') === normalizedDatasetName &&
				parts?.[2] === flag
			);
		});

		if (flagItemDef) {
			potentialDuplicates.push({
				variable: flag,
				reason:
					flag === 'ONTRTFL'
						? 'On-treatment flag that might create treatment-specific duplicates'
						: 'Post-treatment flag that might create post-treatment duplicates',
				affectedParamcds: [],
				severity: 'medium'
			});
		}
	}

	// 6. Look for ASEQ - Analysis Sequence Number
	const aseqItemDef = define.ItemDefs?.find((def) => {
		const parts = def.OID?.split('.');
		return (
			parts?.[0] === 'IT' &&
			normalizeDatasetId(parts?.[1] || '') === normalizedDatasetName &&
			parts?.[2] === 'ASEQ'
		);
	});

	if (aseqItemDef) {
		potentialDuplicates.push({
			variable: 'ASEQ',
			reason: 'Analysis sequence number used to distinguish between duplicate records',
			affectedParamcds: [],
			severity: 'medium'
		});
	}

	return potentialDuplicates;
}
