// src/lib/types/define-xml/groups.ts
import type { ItemRef } from './variables';
/**
 * Represents a dataset (ItemGroup) in Define-XML
 * Maps to ItemGroupDef elements
 */
export interface ItemGroup {
	OID: string | null;
	Name: string | null;
	SASDatasetName: string | null;
	Repeating: string | null;
	Purpose: string | null;
	IsReferenceData: string | null;
	StandardOID: string | null;
	Structure: string | null;
	ArchiveLocationID: string | null;
	CommentOID: string | null;
	Description: string | null;
	Class: string | null;

	// Define-XML v2.1 additions
	HasNoData?: string | null;
	IsNonStandard?: string | null;
	DeveloperNotes?: string | null;
	// Optional collection of ItemRefs
	ItemRefs?: Array<ItemRef>;
}
