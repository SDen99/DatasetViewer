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

export interface ItemRef {
	OID: string | null;
	Mandatory: string | null;
	OrderNumber: string | null;
	MethodOID: string | null;
	WhereClauseOID: string | null;
	KeySequence: string | null;
}
