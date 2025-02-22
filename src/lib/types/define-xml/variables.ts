// src/lib/types/define-xml/variables.ts

/**
 * Represents an item definition in Define-XML
 * Maps to ItemDef elements
 */
export interface ItemDef {
	OID: string | null;
	Name: string | null;
	DataType: string | null;
	Length: string | null;
	SignificantDigits: string | null;
	SASFieldName: string | null;
	DisplayFormat: string | null;
	CommentOID: string | null;
	Description: string | null;
	CodeListOID: string | null;
	Origin: string | null;
	OriginType: string | null;
	OriginSource: string | null;
	HasNoData: string | null;
	// Additional attributes
	Dataset: string | null;
	AssignedValue: string | null;
	Common: boolean | null;
	Pages: string | null;
	DeveloperNotes: string | null;
}

/**
 * Represents where clause criteria
 * Maps to def:WhereClauseDef elements
 */
/**
 * Represents a range check within a where clause
 */
export interface RangeCheck {
	Comparator: string | null;
	SoftHard: string | null;
	ItemOID: string | null;
	CheckValues: string | null;
}

/**
 * Represents a where clause definition in Define-XML
 * Maps to def:WhereClauseDef elements
 */

export interface WhereClauseDef {
	OID: string | null;
	Comparator: string | null;
	SoftHard: string | null;
	ItemOID: string | null;
	CheckValues: string | null;
}
