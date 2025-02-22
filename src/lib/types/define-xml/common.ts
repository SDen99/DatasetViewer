// src/lib/types/define-xml/common.ts

/**
 * Base interface for Define-XML entities that have an OID
 */
export interface BaseDefineEntity {
	/** Unique identifier for the entity */
	OID: string | null;

	/** Display name of the entity */
	Name: string | null;

	/** Description of the entity */
	Description: string | null;
}

/**
 * Interface for entities that can have translated text
 */
export interface TranslatableText {
	/** The translated text content */
	TranslatedText?: string | null;

	/** Language code for the translation */
	lang?: string | null;
}

/**
 * Properties related to documentation
 */
export interface DocumentReference {
	/** Reference to document(s) */
	Document?: string;

	/** Page references */
	Pages?: string | null;
}

/**
 * Interface for entities that can be commented on
 */
export interface Commentable {
	/** Reference to a comment by OID */
	CommentOID?: string | null;

	/** Direct comment text */
	Comment?: string | null;
}
