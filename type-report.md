# Type Definition Report

## Summary
- Total type definitions found: 90
- Duplicate types found: 14

## Duplicate Types

### AnalysisDisplay
Found in:
- src/lib/core/processors/defineXML/types.ts:205
- src/lib/types/define-xml/analysis.ts:7

### AnalysisResult
Found in:
- src/lib/core/processors/defineXML/types.ts:170
- src/lib/types/define-xml/analysis.ts:18

### CodeList
Found in:
- src/lib/core/processors/defineXML/types.ts:102
- src/lib/core/processors/defineXML/types.ts:234
- src/lib/types/define-xml/codelists.ts:48

### Comment
Found in:
- src/lib/core/processors/defineXML/types.ts:242
- src/lib/types/define-xml/base.ts:57

### Dictionary
Found in:
- src/lib/core/processors/defineXML/types.ts:157
- src/lib/types/define-xml/dictionaries.ts:7

### Document
Found in:
- src/lib/core/processors/defineXML/types.ts:164
- src/lib/types/define-xml/documents.ts:16

### ItemGroup
Found in:
- src/lib/core/processors/defineXML/types.ts:63
- src/lib/core/processors/defineXML/types.ts:213
- src/lib/types/define-xml/groups.ts:7

### MetaData
Found in:
- src/lib/core/processors/defineXML/types.ts:46
- src/lib/types/define-xml/base.ts:18

### MethodInfo
Found in:
- src/lib/core/processors/defineXML/VLMProcessingLogic.ts:30
- src/lib/types/define-xml/methods.ts:20

### ParsedDefineXML
Found in:
- src/lib/core/processors/defineXML/types.ts:1
- src/lib/core/processors/defineXML/types.ts:249

### Standard
Found in:
- src/lib/core/processors/defineXML/types.ts:53
- src/lib/types/define-xml/base.ts:29

### Study
Found in:
- src/lib/core/processors/defineXML/types.ts:39
- src/lib/types/define-xml/base.ts:7

### UIState
Found in:
- src/lib/core/stores/UIStore.svelte.ts:3
- src/lib/core/types/types.ts:74

### ValueListDef
Found in:
- src/lib/core/processors/defineXML/types.ts:221
- src/lib/types/define-xml/valuelists.ts:7

## All Type Definitions

### src/lib/components/metadata/shared

#### ExpansionType (type)
File: src/lib/components/metadata/shared/expansionUtils.ts:10
```typescript
type ExpansionType = (typeof EXPANSION_TYPE)[keyof typeof EXPANSION_TYPE];  /** * Generate a consistent key for tracking expansion state */ export function getExpansionKey( variableOID: string, expansionType: ExpansionType, methodOID?: string ): string { if (expansionType === EXPANSION_TYPE.METHOD && methodOID) { return `${variableOID}-${methodOID}`;
```

### src/lib/core/processors

#### BaseProcessingResult (interface)
File: src/lib/core/processors/types.ts:2
```typescript
export interface BaseProcessingResult {
	success: boolean;
	error?: string;
}
```

#### DefineXMLProcessingResult (interface)
File: src/lib/core/processors/types.ts:26
```typescript
export interface DefineXMLProcessingResult extends BaseProcessingResult {
	data: ParsedDefineXML;
	metrics?: {
		uploadTime: number;
		fileSize: number;
	};
	ADaM: boolean;
	SDTM: boolean;
}
```

#### ProcessingResult (type)
File: src/lib/core/processors/types.ts:37
```typescript
export type ProcessingResult = Sas7bdatProcessingResult | DefineXMLProcessingResult; 
```

#### Sas7bdatProcessingResult (interface)
File: src/lib/core/processors/types.ts:8
```typescript
export interface Sas7bdatProcessingResult extends BaseProcessingResult {
	data: any[];
	metrics: {
		uploadTime: number;
		datasetSize: number;
		processingTime: number;
	};
	details: {
		columns: string[];
		dtypes: Record<string, string>;
		num_rows: number;
		num_columns: number;
		summary?: Record<string, any>;
		unique_values?: Record<string, any[]>;
	};
}
```

### src/lib/core/processors/defineXML

#### AnalysisDisplay (interface)
File: src/lib/core/processors/defineXML/types.ts:205
```typescript
export interface AnalysisDisplay {
    ID: string | null;
    Title: string | null;
    Document: string | null;
    Pages: string | null;
}
```

#### AnalysisResult (interface)
File: src/lib/core/processors/defineXML/types.ts:170
```typescript
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
```

#### CodeList (interface)
File: src/lib/core/processors/defineXML/types.ts:102
```typescript
export interface CodeList {
	OID: string | null;
	Name: string | null;
	DataType: string | null;
	SASFormatName: string | null;
	StandardOID: string | null;
	IsNonStandard: string | null;
	ExtendedValue: boolean | null; // Changed from def:ExtendedValue
	CodeListItems: {
		CodedValue: string | null;
		OrderNumber: string | null;
		Rank?: string | null;
		ExtendedValue?: boolean;
		Decode?: {
			TranslatedText: string | null;
			lang?: string | null;
		};
		Aliases?: {
			Name: string | null;
			Context: string | null;
		}[];
	}[];
	EnumeratedItems: {
		CodedValue: string | null;
		OrderNumber: string | null;
		Aliases?: {
			Name: string | null;
			Context: string | null;
		}[];
	}[];
	Aliases?: {
		Name: string | null;
		Context: string | null;
	}[];
}
```

#### CodeList (interface)
File: src/lib/core/processors/defineXML/types.ts:234
```typescript
export interface CodeList {
    // ... existing fields ...
    NCICodelist: string | null;
    Code: string | null;
    Terms: Term[];
}
```

#### CodeListInfo (interface)
File: src/lib/core/processors/defineXML/VLMProcessingLogic.ts:12
```typescript
export interface CodeListInfo {
	ordinal: number;
	codedValue: string;
	decode: string;
	isExternal: boolean;
	externalCodeList?: {
		dictionary: string;
		version: string;
	};
}
```

#### comment (interface)
File: src/lib/core/processors/defineXML/types.ts:88
```typescript
export interface comment {
	OID: string | null;
	Description: string | null;
}
```

#### Comment (interface)
File: src/lib/core/processors/defineXML/types.ts:242
```typescript
export interface Comment {
    // ... existing fields ...
    Document: string | null;
    Pages: string | null;
}
```

#### DataType (type)
File: src/lib/core/processors/defineXML/types.ts:187
```typescript
export type DataType = | 'BASIC DATA STRUCTURE' | 'SUBJECT LEVEL ANALYSIS DATASET' | 'OCCURRENCE DATA STRUCTURE' | null;
```

#### Dictionary (interface)
File: src/lib/core/processors/defineXML/types.ts:157
```typescript
export interface Dictionary {
	OID: string | null;
	Name: string | null;
	DataType: string | null;
	Dictionary: string | null;
	Version: string | null;
}
```

#### Document (interface)
File: src/lib/core/processors/defineXML/types.ts:164
```typescript
export interface Document {
	ID: string | null;
	Title: string | null;
	Href: string | null;
}
```

#### itemDef (interface)
File: src/lib/core/processors/defineXML/types.ts:18
```typescript
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
```

#### ItemGroup (interface)
File: src/lib/core/processors/defineXML/types.ts:63
```typescript
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
```

#### ItemGroup (interface)
File: src/lib/core/processors/defineXML/types.ts:213
```typescript
export interface ItemGroup {
    // ... existing fields ...
    KeyVariables: string | null;
    DeveloperNotes: string | null;
    Pages: string | null;
    Label: string | null;
}
```

#### itemRef (interface)
File: src/lib/core/processors/defineXML/types.ts:93
```typescript
export interface itemRef {
	OID: string | null;
	Mandatory: string | null;
	OrderNumber: string | null;
	MethodOID: string | null;
	WhereClauseOID: string | null;
	KeySequence: string | null;
}
```

#### MetaData (interface)
File: src/lib/core/processors/defineXML/types.ts:46
```typescript
export interface MetaData {
	OID: string | null;
	name: string | null;
	description: string | null;
	defineVersion: string | null;
}
```

#### method (interface)
File: src/lib/core/processors/defineXML/types.ts:79
```typescript
export interface method {
	OID: string | null;
	Name: string | null;
	Type: string | null;
	Description: string | null;
	Document: string | undefined;
	Pages: string | null;
}
```

#### MethodInfo (interface)
File: src/lib/core/processors/defineXML/VLMProcessingLogic.ts:30
```typescript
export interface MethodInfo {
	type: string | null;
	description: string | null;
	document?: string;
	translatedText?: string | null;
}
```

#### OriginInfo (interface)
File: src/lib/core/processors/defineXML/VLMProcessingLogic.ts:23
```typescript
export interface OriginInfo {
	type: string;
	source: string | null;
	description?: string | null;
	translatedText?: string | null;
}
```

#### ParsedDefineXML (interface)
File: src/lib/core/processors/defineXML/types.ts:1
```typescript
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
```

#### ParsedDefineXML (interface)
File: src/lib/core/processors/defineXML/types.ts:249
```typescript
export interface ParsedDefineXML {
    // ... existing fields ...
    terms: Term[];
    dictionaries: Dictionary[];
    documents: Document[];
    analysisDisplays: AnalysisDisplay[];
    analysisResults: AnalysisResult[];
}
```

#### ProcessedVLM (interface)
File: src/lib/core/processors/defineXML/VLMProcessingLogic.ts:74
```typescript
export interface ProcessedVLM {
	dataset: string;
	variables: Map<string, VLMVariable>;
}
```

#### Standard (interface)
File: src/lib/core/processors/defineXML/types.ts:53
```typescript
export interface Standard {
	OID: string | null;
	Name: string | null;
	Type: string | null;
	Status: string | null;
	Version: string | null;
	PublishingSet: string | null;
	CommentOID: string | null;
}
```

#### Study (interface)
File: src/lib/core/processors/defineXML/types.ts:39
```typescript
export interface Study {
	OID: string | null;
	name: string | null;
	description: string | null;
	protocolName: string | null;
}
```

#### Term (interface)
File: src/lib/core/processors/defineXML/types.ts:195
```typescript
export interface Term {
    Order: string | null;
    Term: string | null;
    NCITerm: string | null;
    Code: string | null;
    DecodedValue: string | null;
}
```

#### valueListDef (interface)
File: src/lib/core/processors/defineXML/types.ts:146
```typescript
export interface valueListDef {
	OID: string | null;
	ItemRefs: {
		ItemOID: string | null;
		Mandatory: string | null;
		OrderNumber: string | null;
		MethodOID: string | null;
		WhereClauseOID: string | null;
	}[];
}
```

#### ValueListDef (interface)
File: src/lib/core/processors/defineXML/types.ts:221
```typescript
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
```

#### VLMItemRef (interface)
File: src/lib/core/processors/defineXML/VLMProcessingLogic.ts:37
```typescript
export interface VLMItemRef {
	paramcd: string;
	paramInfo?: CodeListInfo;
	whereClause?: {
		comparator: string;
		checkValues: string[];
		itemOID?: string;
		source?: {
			domain: string;
			variable: string;
		};
	};
	method?: MethodInfo;
	origin?: OriginInfo;
	itemDescription?: string | null;
	mandatory: boolean;
	orderNumber: number;
	sources?: {
		[variable: string]: {
			domain?: string;
			variable?: string;
			type?: string;
			value?: string;
		};
	};
}
```

#### VLMVariable (interface)
File: src/lib/core/processors/defineXML/VLMProcessingLogic.ts:64
```typescript
export interface VLMVariable {
	name: string;
	valueListDef: {
		OID: string;
		itemRefs: VLMItemRef[];
	};
	origin?: string;
	codeList?: string;
}
```

#### whereClauseDef (interface)
File: src/lib/core/processors/defineXML/types.ts:138
```typescript
export interface whereClauseDef {
	OID: string | null;
	Comparator: string | null;
	SoftHard: string | null;
	ItemOID: string | null;
	CheckValues: string | null;
}
```

### src/lib/core/services

#### AppPersistentState (interface)
File: src/lib/core/services/StorageServices.ts:24
```typescript
export interface AppPersistentState {
	lastSelectedDataset: string | null;
	datasetViews: Record<string, DatasetViewState>;
	uiPreferences: UIState;
	metadataViews: Record<string, SerializedMetadataViewState>;
}
```

#### DatasetViewState (interface)
File: src/lib/core/services/StorageServices.ts:5
```typescript
export interface DatasetViewState {
	selectedColumns: string[];
	columnOrder: string[];
	columnWidths: Record<string, number>;
	sort: SortConfig[];
}
```

#### MetadataViewState (interface)
File: src/lib/core/services/StorageServices.ts:13
```typescript
export interface MetadataViewState {
	expansions: Set<string>;
	searchTerm: string;
}
```

#### SerializedMetadataViewState (interface)
File: src/lib/core/services/StorageServices.ts:19
```typescript
export interface SerializedMetadataViewState {
	expansions: string[];
	searchTerm: string;
}
```

### src/lib/core/stores

#### AppError (interface)
File: src/lib/core/stores/errorStore.ts:11
```typescript
export interface AppError {
	id: string;
	message: string;
	severity: ErrorSeverity;
	timestamp: Date;
	context?: Record<string, any>;
	retry?: () => Promise<void>;
}
```

#### ErrorSeverity (enum)
File: src/lib/core/stores/errorStore.ts:4
```typescript
export enum ErrorSeverity {
	INFO = 'info',
	WARNING = 'warning',
	ERROR = 'error',
	CRITICAL = 'critical'
}
```

#### ErrorState (interface)
File: src/lib/core/stores/errorStore.ts:21
```typescript
interface ErrorState {
	errors: AppError[];
	hasUnreadErrors: boolean;
}
```

#### MethodDisplayProps (interface)
File: src/lib/core/stores/metadata.types.ts:12
```typescript
export interface MethodDisplayProps {
	methodOID: string;
	methods: method[];
	comments: comment[];
	codeLists: CodeList[];
	itemDef?: itemDef;
	isExpanded: boolean;
	onToggle: () => void;
}
```

#### UIState (interface)
File: src/lib/core/stores/UIStore.svelte.ts:3
```typescript
export interface UIState {
	leftSidebarOpen: boolean;
	rightSidebarOpen: boolean;
	leftSidebarWidth: number;
	rightSidebarWidth: number;

	viewMode: 'data' | 'metadata' | 'VLM';
	SDTM: boolean;
	ADaM: boolean;
	metadataViewMode: String;
}
```

#### VariableDisplayProps (interface)
File: src/lib/core/stores/metadata.types.ts:3
```typescript
export interface VariableDisplayProps {
	variable: itemDef;
	methodOID?: string | null;
	hasVLM?: boolean;
	orderNumber?: string;
	keySequence?: string;
	mandatory?: string;
}
```

### src/lib/core/types

#### Dataset (interface)
File: src/lib/core/types/types.ts:37
```typescript
export interface Dataset {
	fileName: string;
	data: any[];
	details: {
		columns: string[];
		dtypes: Record<string, string>;
		num_columns: number;
		num_rows: number;
	};
	processingStats: ProcessingStats;
	defineAssociation?: {
		type: 'SDTM' | 'ADaM';
		defineId: string;
		timestamp: number;
	};
	isMetadataOnly?: boolean;
}
```

#### DatasetLoadingState (interface)
File: src/lib/core/types/types.ts:54
```typescript
export interface DatasetLoadingState {
	progress: number; // 0 to 100
	fileName: string;
	totalSize: number;
	loadedSize: number;
	status: 'queued' | 'loading' | 'processing' | 'complete' | 'error';
	error?: string;
}
```

#### FileProcessor (interface)
File: src/lib/core/types/fileTypes.ts:15
```typescript
export interface FileProcessor {
	validateFile(file: File): ValidationResult;
	processFile(
		file: File,
		onProgress?: (state: DatasetLoadingState) => void
	): Promise<ProcessingResult>;
}
```

#### FileType (enum)
File: src/lib/core/types/fileTypes.ts:4
```typescript
export enum FileType {
	SAS7BDAT = 'SAS7BDAT',
	DEFINEXML = 'DEFINEXML'
}
```

#### InitState (type)
File: src/lib/core/types/types.ts:98
```typescript
export type InitState = {
	status: 'idle' | 'initializing' | 'ready' | 'error';
	container: ServiceContainer | null;
	error?: Error;
	progress: {
		step: 'services' | 'dataset' | 'ui';
		message: string;
	} | null;
};
```

#### ManagedWorker (interface)
File: src/lib/core/types/types.ts:18
```typescript
export interface ManagedWorker {
	worker: Worker;
	busy: boolean;
	lastUsed: number;
	pyodideReady: boolean;
}
```

#### PersistedState (interface)
File: src/lib/core/types/types.ts:67
```typescript
export interface PersistedState {
	selectedColumns: string[];
	columnOrder: string[];
	columnWidths: Record<string, number>;
	sort: SortConfig[];
}
```

#### ProcessingStats (interface)
File: src/lib/core/types/types.ts:25
```typescript
export interface ProcessingStats {
	uploadTime: number | null;
	numColumns: number | null;
	numRows: number | null;
	datasetSize: number | null;
}
```

#### PyodideInterface (interface)
File: src/lib/core/types/types.ts:2
```typescript
export interface PyodideInterface {
	loadPackage: (name: string) => Promise<void>;
	runPythonAsync: (code: string) => Promise<string>;
	FS: {
		writeFile: (path: string, data: Uint8Array) => void;
	};
}
```

#### ServiceContainer (interface)
File: src/lib/core/types/types.ts:91
```typescript
export interface ServiceContainer {
	getWorkerPool(): WorkerPool;
	getDatasetService(): DatasetService;
	getUIStateService(): UIStateService;
	dispose(): void;
}
```

#### SortConfig (type)
File: src/lib/core/types/types.ts:62
```typescript
export type SortConfig = {
	column: string;
	direction: 'asc' | 'desc';
};
```

#### UIState (interface)
File: src/lib/core/types/types.ts:74
```typescript
export interface UIState {
	selectedDataset: string | null;
	columnStates: Record<
		string,
		{
			selectedColumns: string[];
			columnOrder: string[];
			columnWidths: Record<string, number>;
			sort: SortConfig[];
		}
	>;
}
```

#### ValidationResult (interface)
File: src/lib/core/types/fileTypes.ts:9
```typescript
export interface ValidationResult {
	valid: boolean;
	error?: string;
	fileType?: FileType;
}
```

#### VariableType (interface)
File: src/lib/core/types/types.ts:32
```typescript
export interface VariableType {
	name: string;
	dtype: string;
}
```

#### WorkerTask (interface)
File: src/lib/core/types/types.ts:10
```typescript
export interface WorkerTask {
	id: string;
	file: ArrayBuffer | null;
	fileName: string;
	resolve: (result: ProcessingResult) => void;
	reject: (error: Error) => void;
}
```

### src/lib/types/define-xml

#### AnalysisDataset (interface)
File: src/lib/types/define-xml/analysis.ts:39
```typescript
export interface AnalysisDataset {
	ItemGroupOID: string;
	WhereClauseRefs?: Array<{
		WhereClauseOID: string;
	}>;
}
```

#### AnalysisDisplay (interface)
File: src/lib/types/define-xml/analysis.ts:7
```typescript
export interface AnalysisDisplay {
	ID: string | null;
	Title: string | null;
	Document: string | null;
	Pages: string | null;
}
```

#### AnalysisResult (interface)
File: src/lib/types/define-xml/analysis.ts:18
```typescript
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
```

#### AnalysisVariable (interface)
File: src/lib/types/define-xml/analysis.ts:50
```typescript
export interface AnalysisVariable {
	ItemOID: string;
	WhereClauseRefs?: Array<{
		WhereClauseOID: string;
	}>;
}
```

#### BaseDefineEntity (interface)
File: src/lib/types/define-xml/common.ts:6
```typescript
export interface BaseDefineEntity {
	/** Unique identifier for the entity */
	OID: string | null;

	/** Display name of the entity */
	Name: string | null;

	/** Description of the entity */
	Description: string | null;
}
```

#### CodeList (interface)
File: src/lib/types/define-xml/codelists.ts:48
```typescript
export interface CodeList {
	OID: string | null;
	Name: string | null;
	DataType: string | null;
	SASFormatName: string | null;
	StandardOID: string | null;
	IsNonStandard: string | null;
	ExtendedValue: boolean | null;
	CodeListItems: CodeListItem[];
	EnumeratedItems: EnumeratedItem[];
	Aliases: CodeListAlias[];
}
```

#### CodeListAlias (interface)
File: src/lib/types/define-xml/codelists.ts:16
```typescript
export interface CodeListAlias {
	Name: string | null;
	Context: string | null;
}
```

#### CodeListDecode (interface)
File: src/lib/types/define-xml/codelists.ts:7
```typescript
export interface CodeListDecode {
	TranslatedText: string | null;
	Lang: string | null;
}
```

#### CodeListItem (interface)
File: src/lib/types/define-xml/codelists.ts:25
```typescript
export interface CodeListItem {
	CodedValue: string | null;
	OrderNumber: string | null;
	Rank: string | null;
	ExtendedValue: boolean;
	Decode: CodeListDecode | null;
	Aliases: CodeListAlias[];
}
```

#### Comment (interface)
File: src/lib/types/define-xml/base.ts:57
```typescript
export interface Comment {
	OID: string | null;
	Description: string | null;
}
```

#### Commentable (interface)
File: src/lib/types/define-xml/common.ts:42
```typescript
export interface Commentable {
	/** Reference to a comment by OID */
	CommentOID?: string | null;

	/** Direct comment text */
	Comment?: string | null;
}
```

#### DefineXML (interface)
File: src/lib/types/define-xml/documents.ts:26
```typescript
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
```

#### Dictionary (interface)
File: src/lib/types/define-xml/dictionaries.ts:7
```typescript
export interface Dictionary {
	OID: string | null;
	Name: string | null;
	DataType: string | null;
	Dictionary: string | null;
	Version: string | null;
}
```

#### Document (interface)
File: src/lib/types/define-xml/documents.ts:16
```typescript
export interface Document {
	ID: string | null;
	Title: string | null;
	Href: string | null;
}
```

#### DocumentRef (interface)
File: src/lib/types/define-xml/base.ts:43
```typescript
export interface DocumentRef {
	LeafID: string; // Changed from leafID to LeafID
	Title: string | null; // Changed from title to Title
	Href: string | null; // Changed from href to Href
	Type: string | null; // Changed from type to Type
	PageRefs: string | null; // Changed from pageRefs to PageRefs
	FirstPage: string | null; // Changed from firstPage to FirstPage
	LastPage: string | null; // Changed from lastPage to LastPage
}
```

#### DocumentReference (interface)
File: src/lib/types/define-xml/common.ts:31
```typescript
export interface DocumentReference {
	/** Reference to document(s) */
	Document?: string;

	/** Page references */
	Pages?: string | null;
}
```

#### EnumeratedItem (interface)
File: src/lib/types/define-xml/codelists.ts:38
```typescript
export interface EnumeratedItem {
	CodedValue: string | null;
	OrderNumber: string | null;
	Aliases: CodeListAlias[];
}
```

#### ItemDef (interface)
File: src/lib/types/define-xml/variables.ts:7
```typescript
export interface ItemDef {
	OID: string | null;
	Name: string | null;
	DataType: string | null;
	Length: string | null;
	SignificantDigits: string | null;
	SASFieldName: string | null;
	DisplayFormat: string | null;
	CommentOID: string | null;
	Description: string | null;
	CodeListOID: string | null;
	Origin: string | null;
	OriginType: string | null;
	OriginSource: string | null;
	HasNoData: string | null;
	// Additional attributes
	Dataset: string | null;
	AssignedValue: string | null;
	Common: boolean | null;
	Pages: string | null;
	DeveloperNotes: string | null;
}
```

#### ItemGroup (interface)
File: src/lib/types/define-xml/groups.ts:7
```typescript
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
```

#### MetaData (interface)
File: src/lib/types/define-xml/base.ts:18
```typescript
export interface MetaData {
	OID: string | null;
	Name: string | null; // Changed from name to Name
	Description: string | null; // Changed from description to Description
	DefineVersion: string | null; // Changed from defineVersion to DefineVersion
}
```

#### Method (interface)
File: src/lib/types/define-xml/methods.ts:7
```typescript
export interface Method {
	OID: string | null;
	Name: string | null;
	Type: string | null;
	Description: string | null;
	Document: string | null;
	Pages: string | null;
}
```

#### MethodInfo (interface)
File: src/lib/types/define-xml/methods.ts:20
```typescript
export interface MethodInfo {
	Type: string | null;
	Description: string | null;
	Document?: string;
	TranslatedText?: string | null;
}
```

#### RangeCheck (interface)
File: src/lib/types/define-xml/variables.ts:37
```typescript
export interface RangeCheck {
	Comparator: string | null;
	SoftHard: string | null;
	ItemOID: string | null;
	CheckValues: string | null;
}
```

#### Standard (interface)
File: src/lib/types/define-xml/base.ts:29
```typescript
export interface Standard {
	OID: string | null;
	Name: string | null;
	Type: string | null;
	Status: string | null;
	Version: string | null;
	PublishingSet: string | null;
	CommentOID: string | null;
}
```

#### Study (interface)
File: src/lib/types/define-xml/base.ts:7
```typescript
export interface Study {
	OID: string | null;
	Name: string | null;
	Description: string | null;
	ProtocolName: string | null;
}
```

#### TranslatableText (interface)
File: src/lib/types/define-xml/common.ts:20
```typescript
export interface TranslatableText {
	/** The translated text content */
	TranslatedText?: string | null;

	/** Language code for the translation */
	lang?: string | null;
}
```

#### TranslatedText (interface)
File: src/lib/types/define-xml/base.ts:66
```typescript
export interface TranslatedText {
	Content: string; // Changed from content to Content
	Lang: string | null; // Changed from lang to Lang
}
```

#### ValueListDef (interface)
File: src/lib/types/define-xml/valuelists.ts:7
```typescript
export interface ValueListDef {
	OID: string | null;
	ItemRefs: ItemRef[];
}
```

#### WhereClauseDef (interface)
File: src/lib/types/define-xml/variables.ts:49
```typescript
export interface WhereClauseDef {
	OID: string | null;
	Comparator: string | null;
	SoftHard: string | null;
	ItemOID: string | null;
	CheckValues: string | null;
}
```

### src/scripts

#### TypeDefinition (interface)
File: src/scripts/find-types.ts:4
```typescript
interface TypeDefinition {
	name: string;
	filePath: string;
	lineNumber: number;
	content: string;
	kind: 'interface' | 'type' | 'enum';
}
```

#### TypeReport (interface)
File: src/scripts/find-types.ts:12
```typescript
interface TypeReport {
	definitions: TypeDefinition[];
	duplicates: {
		name: string;
		locations: {
			filePath: string;
			lineNumber: number;
		}[];
	}[];
}
```
