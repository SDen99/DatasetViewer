// src/lib/types/define-xml/documents.ts

import type { Study, MetaData, Standard, Comment } from './base';
import type { ItemGroup } from './groups';
import type { Method } from './methods';
import type { ItemDef, ItemRef, WhereClauseDef } from './variables';
import type { CodeList } from './codelists';
import type { Dictionary } from './dictionaries';
import type { ValueListDef } from './valuelists';
import type { AnalysisResult } from './analysis';

/**
 * Represents a document (leaf) in Define-XML
 * Maps to def:leaf elements
 */
export interface Document {
	ID: string | null;
	Title: string | null;
	Href: string | null;
}

/**
 * Represents the root ODM document structure
 * Maps to ODM element
 */
export interface DefineXML {
	Study: Study;
	MetaData: MetaData;
	Standards: Standard[];
	ItemGroups: ItemGroup[];
	Methods: Method[];
	ItemDefs: ItemDef[];
	ItemRefs: ItemRef[];
	Comments: Comment[];
	CodeLists: CodeList[];
	WhereClauseDefs: WhereClauseDef[];
	ValueListDefs: ValueListDef[];
	Dictionaries: Dictionary[];
	Documents: Document[];
	AnalysisResults: AnalysisResult[];
}
