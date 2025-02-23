export type ComparatorType = 'EQ' | 'NE' | 'LT' | 'LE' | 'GT' | 'GE' | 'IN' | 'NOTIN';

/**
 * Represents a where clause definition in Define-XML
 * Maps to def:WhereClauseDef elements
 */
export interface RangeCheck {
	Comparator: ComparatorType;
	SoftHard: 'Soft' | 'Hard';
	ItemOID: string;
	CheckValues: string[];
}

/**
 * Represents where clause criteria
 * Maps to def:WhereClauseDef elements
 */
/**
 * Represents a range check within a where clause
 */
export interface WhereClauseDef {
	OID: string;
	CommentOID?: string | null;
	RangeChecks: RangeCheck[];
}

// For VLM processing
export interface WhereClauseCondition {
	variable: string; // Extracted from ItemOID
	comparator: ComparatorType;
	values: string[];
}

export interface ProcessedWhereClause {
	paramcd: string; // When the condition is about PARAMCD
	conditions: WhereClauseCondition[];
}

// For the final VLM output
export interface VLMWhereClause {
	comparator: ComparatorType;
	checkValues: string[];
	itemOID?: string;
	source?: {
		domain: string;
		variable: string;
	};
}
