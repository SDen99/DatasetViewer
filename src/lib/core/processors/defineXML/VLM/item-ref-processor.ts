/**
 * Processes ItemRefs within a ValueListDef to create VLMItemRefs
 * @param valueListDef The ValueListDef to process
 * @param define The parsed Define-XML document
 * @param paramcdToParamMap Mapping of PARAMCD to PARAM values
 * @param datasetName The name of the dataset
 * @returns Array of VLMItemRefs
 */

import { processWhereClause } from './where-clause-processor';
import type { VLMItemRef } from '$lib/types/VLMtypes';
import type {
	ParsedDefineXML,
	ValueListDef,
	ItemDef,
	CodeList,
	Comment
} from '$lib/types/define-xml';
import { methodUtils } from '$lib/utils/defineXML/methodUtils';

/**
 * Process codelist information from an ItemDef
 * @param itemDef The ItemDef to process codelist from
 * @param codeLists Array of all CodeLists
 * @returns Codelist info object or undefined if no codelist
 */
function processCodelistInfo(itemDef: ItemDef, codeLists: CodeList[]) {
	if (!itemDef.CodeListOID) return undefined;

	const codeList = codeLists.find((cl) => cl.OID === itemDef.CodeListOID);
	if (!codeList) return undefined;

	const result = {
		OID: codeList.OID,
		name: codeList.Name || undefined,
		items: [] as Array<{ codedValue: string; decode: string; isExtended?: boolean }>
	};

	// Process CodeListItems if available
	if (codeList.CodeListItems && codeList.CodeListItems.length > 0) {
		codeList.CodeListItems.forEach((item) => {
			if (item.CodedValue && item.Decode?.TranslatedText) {
				result.items.push({
					codedValue: item.CodedValue,
					decode: item.Decode.TranslatedText,
					isExtended: item.ExtendedValue === 'Yes'
				});
			}
		});
	}

	// Process EnumeratedItems if available
	if (codeList.EnumeratedItems && codeList.EnumeratedItems.length > 0) {
		codeList.EnumeratedItems.forEach((item) => {
			if (item.CodedValue) {
				result.items.push({
					codedValue: item.CodedValue,
					decode: item.CodedValue // For enumerated items, decode is the same as coded value
				});
			}
		});
	}

	return result.items.length > 0 ? result : undefined;
}

/**
 * Process origin information from an ItemDef
 * @param itemDef The ItemDef to process origin from
 * @returns Origin info object or undefined if no origin
 */
function processOriginInfo(itemDef: ItemDef):
	| {
			type: string;
			source: string | null;
			description: string | null;
			translatedText: string | null;
	  }
	| undefined {
	if (!itemDef.OriginType && !itemDef.Origin) return undefined;

	return {
		type: itemDef.OriginType || '',
		source: itemDef.Origin || null,
		description: itemDef.Description || null,
		translatedText: (itemDef as any).OriginTranslatedText || null
	};
}

/**
 * Process comment information from an ItemDef
 * @param itemDef The ItemDef to process comments from
 * @param comments Array of all Comments
 * @returns Comment info object or undefined if no comment
 */
function processCommentInfo(itemDef: ItemDef, comments: Comment[] | undefined) {
	// Return early if no CommentOID in itemDef or no comments array
	if (!itemDef.CommentOID || !comments || !Array.isArray(comments)) return undefined;

	const comment = comments.find((c) => c.OID === itemDef.CommentOID);
	if (!comment) return undefined;

	// Debug: Log the found comment
	console.log(`Found comment with OID ${comment.OID}:`, comment);

	// Based on the actual structure where Description is a string
	return {
		OID: comment.OID,
		description: typeof comment.Description === 'string' ? comment.Description : undefined
	};
}

/**
 * Processes ItemRefs within a ValueListDef to create VLMItemRefs
 * Enhanced to properly handle stratification and eliminate non-parameterized entries
 * @param valueListDef The ValueListDef to process
 * @param define The parsed Define-XML document
 * @param paramcdToParamMap Mapping of PARAMCD to PARAM values
 * @param datasetName The name of the dataset
 * @returns Array of VLMItemRefs
 */
/**
 * Debug function to inspect a VLMItemRef object and check for comment information
 * @param itemRef The VLMItemRef to inspect
 */
export function debugInspectVLMItemRef(itemRef: VLMItemRef): void {
	console.group('VLMItemRef Debug Info');
	console.log('PARAMCD:', itemRef.paramcd);
	console.log('OID:', itemRef.OID);
	console.log('Has comment?', itemRef.comment !== undefined);

	if (itemRef.comment) {
		console.group('Comment Details');
		console.log('Comment OID:', itemRef.comment.OID);
		console.log('Comment Description:', itemRef.comment.description);
		console.groupEnd();
	}

	console.log('Has codelist?', itemRef.codelist !== undefined);
	console.log('Has origin?', itemRef.origin !== undefined);
	console.log('Has method?', itemRef.method !== undefined);
	console.groupEnd();
}

export function processParameterItemRefs(
	valueListDef: ValueListDef,
	define: ParsedDefineXML,
	paramcdToParamMap: Map<string, string>,
	datasetName: string
): VLMItemRef[] {
	console.log(`Processing ItemRefs for ValueListDef ${valueListDef.OID}`);
	console.log(`Comments available: ${define.Comments ? define.Comments.length : 0} items`);
	if (define.Comments && define.Comments.length > 0) {
		console.log(`Sample comment OID: ${define.Comments[0].OID}`);
	}
	const itemRefs: VLMItemRef[] = [];

	if (!valueListDef.ItemRefs) {
		console.log(`No ItemRefs found in ValueListDef`);
		return itemRefs;
	}

	console.log(`Found ${valueListDef.ItemRefs.length} ItemRefs to process`);

	// Get all available PARAMCDs as strings
	const allParamcds = Array.from(paramcdToParamMap.keys()).map((paramcd) => String(paramcd));
	console.log(`Available PARAMCDs: ${allParamcds.length}`);

	// Process each ItemRef in the ValueListDef
	valueListDef.ItemRefs.forEach((itemRef, idx) => {
		console.log(`Processing ItemRef #${idx + 1}: ${itemRef.OID || 'unknown OID'}`);

		// Skip if we don't have a reference to process
		if (!itemRef.OID) {
			console.log(`No OID found, skipping ItemRef`);
			return;
		}

		// Find the ItemDef that this ItemRef points to
		console.log(`Looking up ItemDef: ${itemRef.OID}`);
		const itemDef = define.ItemDefs.find((def) => def.OID === itemRef.OID);
		if (!itemDef) {
			console.warn(`ItemDef not found for OID: ${itemRef.OID}`);
			return;
		}
		console.log(`Found ItemDef: ${itemDef.Name || itemDef.OID}`);

		// Get codelist info if this ItemDef has a codelist
		let codelistInfo;
		if (itemDef.CodeListOID) {
			console.log(`Processing codelist: ${itemDef.CodeListOID}`);
			codelistInfo = processCodelistInfo(itemDef, define.CodeLists);
		}

		// Process origin information
		const originInfo = processOriginInfo(itemDef);

		// Process comment information
		let commentInfo;
		try {
			// The CommentOID could be directly on itemDef or in a namespace property
			const commentOID = itemDef.CommentOID || (itemDef as any)['def:CommentOID'];

			if (commentOID) {
				const tempItemDef = { ...itemDef, CommentOID: commentOID };
				commentInfo = processCommentInfo(tempItemDef, define.Comments);
				if (commentInfo) {
					console.log(
						`Processed comment: ${commentInfo.OID}, Description: "${commentInfo.description}"`
					);
				}
			}
		} catch (error) {
			console.warn(`Error processing comments: ${error.message}. Continuing without comments.`);
		}

		// Process the WhereClause to determine which parameters and conditions this applies to
		if (!itemRef.WhereClauseOID) {
			console.log(`No WhereClauseOID found - this will apply to all parameters`);

			// When no WhereClauseOID is specified, this applies to ALL parameters
			allParamcds.forEach((paramcd) => {
				const vlmItemRef: VLMItemRef = {
					paramcd, // Already ensured to be a string
					paramInfo: {
						ordinal: parseInt(itemRef.OrderNumber || '0', 10),
						codedValue: paramcd,
						decode: paramcdToParamMap.get(paramcd) || paramcd,
						isExternal: false
					},
					method: itemRef.MethodOID
						? methodUtils.processMethod(itemRef.MethodOID, define.Methods)
						: undefined,
					methodOID: itemRef.MethodOID,
					valueListOID: valueListDef.OID,
					OID: itemDef.OID,
					codelist: codelistInfo,
					origin: originInfo,
					comment: commentInfo,
					itemDescription: itemDef.Description,
					mandatory: itemRef.Mandatory === 'Yes',
					orderNumber: parseInt(itemRef.OrderNumber || '0', 10),
					specialVariables: {}
				};

				itemRefs.push(vlmItemRef);
			});

			console.log(`Added entries for all ${allParamcds.length} parameters with no WhereClause`);
			return;
		}

		console.log(`Processing WhereClause: ${itemRef.WhereClauseOID}`);
		const whereClauseResult = processWhereClause(
			itemRef.WhereClauseOID,
			define.WhereClauseDefs,
			datasetName
		);

		if (!whereClauseResult) {
			console.warn(`No WhereClauseResult for WhereClauseOID: ${itemRef.WhereClauseOID}`);
			return;
		}

		// Extract stratification variables from the where clause result
		const stratificationVariables = new Map<string, { comparator: string; values: string[] }>();
		whereClauseResult.conditions.forEach((condition) => {
			if (
				condition.variable !== 'PARAMCD' &&
				['DTYPE', 'PARCAT', 'PARCAT1', 'PARCAT2', 'QNAM', 'QVAL'].includes(condition.variable)
			) {
				stratificationVariables.set(condition.variable, {
					comparator: condition.comparator,
					values: condition.values
				});
			}
		});

		// Create stratification info object for display
		const stratificationInfo =
			stratificationVariables.size > 0
				? Object.fromEntries(
						Array.from(stratificationVariables.entries()).map(([variable, details]) => [
							variable,
							details
						])
					)
				: undefined;

		// If no PARAMCD values found in the WhereClause, this applies to ALL parameters
		if (whereClauseResult.paramcds.length === 0) {
			console.log(
				`No PARAMCDs found in WhereClause, applying to all parameters with stratification`
			);

			// Create an entry for each PARAMCD
			allParamcds.forEach((paramcd) => {
				const vlmItemRef: VLMItemRef = {
					paramcd, // Already ensured to be a string
					paramInfo: {
						ordinal: parseInt(itemRef.OrderNumber || '0', 10),
						codedValue: paramcd,
						decode: paramcdToParamMap.get(paramcd) || paramcd,
						isExternal: false
					},
					whereClause: whereClauseResult.conditions[0]
						? {
								comparator: whereClauseResult.conditions[0].comparator,
								checkValues: whereClauseResult.conditions[0].values,
								whereClauseOID: itemRef.WhereClauseOID,
								OID: itemRef.OID || '',
								source: {
									domain: datasetName,
									variable: whereClauseResult.conditions[0].variable
								}
							}
						: undefined,
					method: itemRef.MethodOID
						? methodUtils.processMethod(itemRef.MethodOID, define.Methods)
						: undefined,
					methodOID: itemRef.MethodOID,
					valueListOID: valueListDef.OID,
					OID: itemDef.OID,
					codelist: codelistInfo,
					origin: originInfo,
					comment: commentInfo,
					itemDescription: itemDef.Description,
					mandatory: itemRef.Mandatory === 'Yes',
					orderNumber: parseInt(itemRef.OrderNumber || '0', 10),
					specialVariables: whereClauseResult.specialVariables,
					stratificationInfo
				};

				itemRefs.push(vlmItemRef);
			});

			console.log(`Added ${allParamcds.length} stratified entries for all parameters`);
			return;
		}

		// Create an ItemRef for each PARAMCD value this applies to
		console.log(
			`Creating ItemRefs for ${whereClauseResult.paramcds.length} parameters from WhereClause`
		);
		whereClauseResult.paramcds.forEach((paramcd, pIdx) => {
			// Ensure paramcd is a string
			const paramcdStr = String(paramcd);

			console.log(`Creating ItemRef for parameter: ${paramcdStr}`);

			// Get the PARAM decode value for this PARAMCD
			const paramDecode = paramcdToParamMap.get(paramcdStr) || paramcdStr;
			console.log(`PARAM value: ${paramDecode}`);

			const vlmItemRef: VLMItemRef = {
				paramcd: paramcdStr,
				paramInfo: {
					ordinal: parseInt(itemRef.OrderNumber || '0', 10),
					codedValue: paramcdStr,
					decode: paramDecode,
					isExternal: false
				},
				whereClause: whereClauseResult.conditions[0]
					? {
							comparator: whereClauseResult.conditions[0].comparator,
							checkValues: whereClauseResult.conditions[0].values,
							whereClauseOID: itemRef.WhereClauseOID,
							OID: itemRef.OID || '',
							source: {
								domain: datasetName,
								variable: whereClauseResult.conditions[0].variable
							}
						}
					: undefined,
				method: itemRef.MethodOID
					? methodUtils.processMethod(itemRef.MethodOID, define.Methods)
					: undefined,
				methodOID: itemRef.MethodOID,
				valueListOID: valueListDef.OID,
				OID: itemDef.OID,
				codelist: codelistInfo,
				origin: originInfo,
				comment: commentInfo,
				itemDescription: itemDef.Description,
				mandatory: itemRef.Mandatory === 'Yes',
				orderNumber: parseInt(itemRef.OrderNumber || '0', 10),
				specialVariables: whereClauseResult.specialVariables,
				stratificationInfo
			};

			itemRefs.push(vlmItemRef);
			console.log(`Added ItemRef for ${paramcdStr} successfully`);
		});
	});

	console.log(`Processed ${itemRefs.length} total ItemRefs for ValueListDef ${valueListDef.OID}`);

	// Check how many ItemRefs have comments
	const itemRefsWithComments = itemRefs.filter((ref) => ref.comment !== undefined);
	console.log(`ItemRefs with comments: ${itemRefsWithComments.length} / ${itemRefs.length}`);

	if (itemRefsWithComments.length > 0) {
		console.log(`Sample ItemRef with comment: 
			PARAMCD: ${itemRefsWithComments[0].paramcd}, 
			Comment OID: ${itemRefsWithComments[0].comment?.OID}, 
			Comment Description: ${itemRefsWithComments[0].comment?.description}`);
	}

	return itemRefs;
}
