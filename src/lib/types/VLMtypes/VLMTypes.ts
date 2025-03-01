// vlm-types.ts - Type definitions for Value-Level Metadata processing

import type { RangeCheck } from '$lib/types/define-xml';

/**
 * Structure representing processed Value-Level Metadata for a dataset
 */
export interface ProcessedVLM {
	dataset: string;
	variables: Map<string, VLMVariable>;
}

/**
 * Structure representing a variable with Value-Level Metadata
 */
export interface VLMVariable {
	name: string;
	valueListDef: {
		OID: string;
		description?: string;
		ItemRefs: VLMItemRef[];
	};
	origin?: string;
	codeList?: string;
}

/**
 * Structure representing a parameter-specific item reference in Value-Level Metadata
 */
export interface VLMItemRef {
	paramcd: string;
	paramInfo?: {
		ordinal: number;
		codedValue: string;
		decode: string;
		isExternal: boolean;
	};
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
	method?: {
		Type?: string;
		Description?: string;
		TranslatedText?: string;
	};
	origin?: {
		type: string;
		source: string | null;
		description?: string | null;
		translatedText?: string | null;
	};
	itemDescription?: string | null;
	mandatory: boolean;
	orderNumber: number;
	codelist?: {
		OID: string;
		name?: string;
		items?: Array<{
			codedValue: string;
			decode: string;
			isExtended?: boolean;
		}>;
	};
	isNonParameterized?: boolean;
	specialVariables?: Record<string, string>;
	stratificationInfo?: Record<
		string,
		{
			comparator: RangeCheck['Comparator'];
			values: string[];
		}
	>;
}

/**
 * Result of processing a WhereClause, containing parameters and conditions
 */
export interface WhereClauseResult {
	paramcds: string[];
	conditions: Array<{
		variable: string;
		comparator: RangeCheck['Comparator'];
		values: string[];
	}>;
	stratificationVariables: Map<
		string,
		{
			comparator: RangeCheck['Comparator'];
			values: string[];
		}
	>;
	specialVariables: Record<string, string>;
}
