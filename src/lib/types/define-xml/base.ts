// src/lib/types/define-xml/base.ts

/**
 * Represents a Study in Define-XML
 * Maps to ODM/Study/GlobalVariables elements
 */
export interface Study {
	OID: string | null;
	Name: string | null;
	Description: string | null;
	ProtocolName: string | null;
}

/**
 * Represents metadata version information in Define-XML
 * Maps to ODM/Study/MetaDataVersion elements
 */
export interface MetaData {
	OID: string | null;
	Name: string | null; // Changed from name to Name
	Description: string | null; // Changed from description to Description
	DefineVersion: string | null; // Changed from defineVersion to DefineVersion
}

/**
 * Reference to a standard (e.g., SDTM, ADaM)
 * Maps to MetaDataVersion/def:Standards/def:Standard elements
 */
export interface Standard {
	OID: string | null;
	Name: string | null;
	Type: string | null;
	Status: string | null;
	Version: string | null;
	PublishingSet: string | null;
	CommentOID: string | null;
}

/**
 * Represents a document reference in Define-XML
 * Used by multiple elements that can reference external documents
 */
export interface DocumentRef {
	LeafID: string; // Changed from leafID to LeafID
	Title: string | null; // Changed from title to Title
	Href: string | null; // Changed from href to Href
	Type: string | null; // Changed from type to Type
	PageRefs: string | null; // Changed from pageRefs to PageRefs
	FirstPage: string | null; // Changed from firstPage to FirstPage
	LastPage: string | null; // Changed from lastPage to LastPage
}

/**
 * Represents a comment in Define-XML
 * Maps to def:CommentDef elements
 */
export interface Comment {
	OID: string | null;
	Description: string | null;
}

/**
 * Represents translated text with optional language
 * Used for descriptions and other text content
 */
export interface TranslatedText {
	Content: string; // Changed from content to Content
	Lang: string | null; // Changed from lang to Lang
}
