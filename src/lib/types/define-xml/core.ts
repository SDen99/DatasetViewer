import type { Study, MetaData, Standard, Comment } from './base';
import type { ItemGroup } from './groups';
import type { Method } from './methods';
import type { ItemDef, ItemRef } from './variables';
import type { CodeList } from './codelists';
import type { WhereClauseDef } from './whereClause';
import type { ValueListDef } from './valuelists';
import type { Dictionary } from './dictionaries';
import type { Document } from './documents';
import type { AnalysisResult } from './analysis';

export interface ParsedDefineXML {
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
