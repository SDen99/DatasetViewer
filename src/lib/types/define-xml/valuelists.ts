// src/lib/types/define-xml/valuelists.ts

/**
 * Represents a value level metadata definition
 * Maps to def:ValueListDef elements in Define-XML
 */
export interface ValueListDef {
	OID: string | null;
	ItemRefs: ItemRef[];
}
