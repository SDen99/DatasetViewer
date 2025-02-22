// src/lib/types/define-xml/codelists.ts

/**
 * Decode information for a CodeList item
 * Maps to Decode elements within CodeListItem
 */
export interface CodeListDecode {
	TranslatedText: string | null;
	Lang: string | null;
}

/**
 * Alias for a CodeList item
 * Maps to Alias elements
 */
export interface CodeListAlias {
	Name: string | null;
	Context: string | null;
}

/**
 * Individual item in a CodeList
 * Maps to CodeListItem elements
 */
export interface CodeListItem {
	CodedValue: string | null;
	OrderNumber: string | null;
	Rank: string | null;
	ExtendedValue: boolean;
	Decode: CodeListDecode | null;
	Aliases: CodeListAlias[];
}

/**
 * Enumerated item in a CodeList
 * Maps to EnumeratedItem elements
 */
export interface EnumeratedItem {
	CodedValue: string | null;
	OrderNumber: string | null;
	Aliases: CodeListAlias[];
}

/**
 * Represents a CodeList in Define-XML
 * Maps to CodeList elements
 */
export interface CodeList {
	OID: string | null;
	Name: string | null;
	DataType: string | null;
	SASFormatName: string | null;
	StandardOID: string | null;
	IsNonStandard: string | null;
	ExtendedValue: boolean | null;
	CodeListItems: CodeListItem[];
	EnumeratedItems: EnumeratedItem[];
	Aliases: CodeListAlias[];
}
