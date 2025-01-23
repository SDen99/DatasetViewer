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

export interface itemDef {
	OID: string | null;
	Dataset: string | null;
	Name: string | null;
	SASFieldName: string | null;
	DataType: string | null;
	Length: string | null;
	Description: string | null;
	OriginType: string | null;
	Origin: string | null;
	OriginSource: string | null;
	CodeListOID: string | null;
	SignificantDigits: string | null;
	Format: string | null;
	AssignedValue: string | null;
	Common: boolean | null;
	Pages: string | null;
	//    Role: string | null;
	Comment: string | null;
	DeveloperNotes: string | null;
}
export interface Study {
	OID: string | null;
	name: string | null;
	description: string | null;
	protocolName: string | null;
}

export interface MetaData {
	OID: string | null;
	name: string | null;
	description: string | null;
	defineVersion: string | null;
}

export interface Standard {
	OID: string | null;
	Name: string | null;
	Type: string | null;
	Status: string | null;
	Version: string | null;
	PublishingSet: string | null;
	CommentOID: string | null;
}

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
	ItemRefs?: itemRef[];
}

export interface method {
	OID: string | null;
	Name: string | null;
	Type: string | null;
	Description: string | null;
	Document: string | null;
	Pages: string | null;
}

export interface comment {
	OID: string | null;
	Description: string | null;
}

export interface itemRef {
	OID: string | null;
	Mandatory: string | null;
	OrderNumber: string | null;
	MethodOID: string | null;
	WhereClauseOID: string | null;
}

export interface CodeList {
	OID: string | null;
	Name: string | null;
	DataType: string | null;
	IsNonStandard: string | null;
}

export interface whereClauseDef {
	OID: string | null;
	Comparator: string | null;
	SoftHard: string | null;
	ItemOID: string | null;
	CheckValues: string | null;
}

export interface valueListDef {
	OID: string | null;
	ItemOID: string | null;
	Mandatory: string | null;
	OrderNumber: string | null;
	MethodOID: string | null;
	WhereClauseOID: string | null;
}

export interface Dictionary {
	OID: string | null;
	Name: string | null;
	DataType: string | null;
	Dictionary: string | null;
	Version: string | null;
}
export interface Document {
	ID: string | null;
	Title: string | null;
	Href: string | null;
}

export interface AnalysisResult {
	Display: string | null;
	ID: string | null;
	Description: string | null;
	Variables: string | null;
	Reason: string | null;
	Purpose: string | null;
	SelectionCriteria: string | null;
	JoinComment: string | null;
	Documentation: string | null;
	DocumentationRefs: string | null;
	ProgrammingContext: string | null;
	ProgrammingCode: string | null;
	ProgrammingDocument: string | null;
	Pages: string | null;
}

export type DataType =
	| 'BASIC DATA STRUCTURE'
	| 'SUBJECT LEVEL ANALYSIS DATASET'
	| 'OCCURRENCE DATA STRUCTURE'
	| null;

/*

export interface Term {
    Order: string | null;
    Term: string | null;
    NCITerm: string | null;
    Code: string | null;
    DecodedValue: string | null;
}



export interface AnalysisDisplay {
    ID: string | null;
    Title: string | null;
    Document: string | null;
    Pages: string | null;
}

// Updated existing interfaces with missing fields
export interface ItemGroup {
    // ... existing fields ...
    KeyVariables: string | null;
    DeveloperNotes: string | null;
    Pages: string | null;
    Label: string | null;
}

export interface ValueListDef {
    // ... existing fields ...
    Label: string | null;
    DataType: string | null;
    Length: string | null;
    SignificantDigits: string | null;
    Format: string | null;
    AssignedValue: string | null;
    Pages: string | null;
    Predecessor: string | null;
    DeveloperNotes: string | null;
}

export interface CodeList {
    // ... existing fields ...
    NCICodelist: string | null;
    Code: string | null;
    Terms: Term[];
}


export interface Comment {
    // ... existing fields ...
    Document: string | null;
    Pages: string | null;
}

// Update ParsedDefineXML interface to include new types
export interface ParsedDefineXML {
    // ... existing fields ...
    terms: Term[];
    dictionaries: Dictionary[];
    documents: Document[];
    analysisDisplays: AnalysisDisplay[];
    analysisResults: AnalysisResult[];
}

*/
