// src/lib/types/define-xml/dictionaries.ts

/**
 * Represents an external dictionary reference in Define-XML
 * Maps to ExternalCodeList elements
 */
export interface Dictionary {
	OID: string | null;
	Name: string | null;
	DataType: string | null;
	Dictionary: string | null;
	Version: string | null;
}
