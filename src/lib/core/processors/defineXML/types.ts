export interface ParsedDefineXML {
	study: Study;
	metaData: MetaData;
	standards: Standard[];
	itemGroups: ItemGroup[];
	methods: method[];
	itemDefs: itemDef[];
	itemRefs: itemRef[];
	comments: comment[];
	CodeLists: CodeList[];
	whereClauseDefs: whereClauseDef[];
	valueListDefs: valueListDef[];
	Dictionaries: Dictionary[];
	Documents: Document[];
	AnalysisResults: AnalysisResult[];
}

export type DataType =
	| 'BASIC DATA STRUCTURE'
	| 'SUBJECT LEVEL ANALYSIS DATASET'
	| 'OCCURRENCE DATA STRUCTURE'
	| null;
