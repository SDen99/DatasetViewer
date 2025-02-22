// src/lib/types/define-xml/methods.ts

/**
 * Represents a Method in Define-XML
 * Maps to MethodDef elements
 */
export interface Method {
	OID: string | null;
	Name: string | null;
	Type: string | null;
	Description: string | null;
	Document: string | null;
	Pages: string | null;
}

/**
 * Information about a method used in VLM
 * Used for processing method references
 */
export interface MethodInfo {
	Type: string | null;
	Description: string | null;
	Document?: string;
	TranslatedText?: string | null;
}
