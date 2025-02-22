# Type Definition Report

## Summary
- Total type definitions found: 89
- Duplicate types found: 18

## Duplicate Types

### AnalysisDisplay
Found in:
- src/lib/core/processors/defineXML/types.ts:205
- src/lib/types/define-xml/analysis.ts:49

### AnalysisResult
Found in:
- src/lib/core/processors/defineXML/types.ts:170
- src/lib/types/define-xml/analysis.ts:8

### CodeList
Found in:
- src/lib/core/processors/defineXML/types.ts:102
- src/lib/core/processors/defineXML/types.ts:234
- src/lib/types/define-xml/codelists.ts:43

### Comment
Found in:
- src/lib/core/processors/defineXML/types.ts:242
- src/lib/types/define-xml/base.ts:57

### Document
Found in:
- src/lib/core/processors/defineXML/types.ts:164
- src/lib/types/define-xml/documents.ts:16

### itemDef
Found in:
- src/lib/core/processors/defineXML/types.ts:18
- src/lib/types/define-xml/variables.ts:8

### ItemGroup
Found in:
- src/lib/core/processors/defineXML/types.ts:63
- src/lib/core/processors/defineXML/types.ts:213
- src/lib/types/define-xml/groups.ts:9

### itemRef
Found in:
- src/lib/core/processors/defineXML/types.ts:93
- src/lib/types/define-xml/variables.ts:52

### MetaData
Found in:
- src/lib/core/processors/defineXML/types.ts:46
- src/lib/types/define-xml/base.ts:18

### method
Found in:
- src/lib/core/processors/defineXML/types.ts:79
- src/lib/types/define-xml/methods.ts:8

### MethodInfo
Found in:
- src/lib/core/processors/defineXML/VLMProcessingLogic.ts:25
- src/lib/types/define-xml/methods.ts:25

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

### valueListDef
Found in:
- src/lib/core/processors/defineXML/types.ts:146
- src/lib/types/define-xml/valuelists.ts:19

### ValueListDef
Found in:
- src/lib/core/processors/defineXML/types.ts:221
- src/lib/types/define-xml/groups.ts:50

### whereClauseDef
Found in:
- src/lib/core/processors/defineXML/types.ts:138
- src/lib/types/define-xml/variables.ts:72

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
File: src/lib/core/processors/defineXML/VLMProcessingLogic.ts:7
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
File: src/lib/core/processors/defineXML/VLMProcessingLogic.ts:25
```typescript
export interface MethodInfo {
	type: string | null;
	description: string | null;
	document?: string;
	translatedText?: string | null;
}
```

#### OriginInfo (interface)
File: src/lib/core/processors/defineXML/VLMProcessingLogic.ts:18
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
File: src/lib/core/processors/defineXML/VLMProcessingLogic.ts:69
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
File: src/lib/core/processors/defineXML/VLMProcessingLogic.ts:32
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
File: src/lib/core/processors/defineXML/VLMProcessingLogic.ts:59
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

#### AnalysisDisplay (interface)
File: src/lib/types/define-xml/analysis.ts:49
```typescript
export interface AnalysisDisplay extends BaseDefineEntity {
	/** Display identifier */
	ID: string | null;

	/** Display title */
	Title: string | null;

	/** Reference to document */
	Document: string | null;

	/** Page references */
	Pages: string | null;
}
```

#### AnalysisResult (interface)
File: src/lib/types/define-xml/analysis.ts:8
```typescript
export interface AnalysisResult extends BaseDefineEntity, ReferenceProperties {
	/** Display identifier */
	Display: string | null;

	/** Analysis identifier */
	ID: string | null;

	/** Variables involved in the analysis */
	Variables: string | null;

	/** Reason for the analysis */
	Reason: string | null;

	/** Purpose of the analysis */
	Purpose: string | null;

	/** Selection criteria */
	SelectionCriteria: string | null;

	/** Comments about data joining */
	JoinComment: string | null;

	/** Documentation text */
	Documentation: string | null;

	/** References to documentation */
	DocumentationRefs: string | null;

	/** Programming context information */
	ProgrammingContext: string | null;

	/** Actual programming code */
	ProgrammingCode: string | null;

	/** Reference to programming document */
	ProgrammingDocument: string | null;
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
File: src/lib/types/define-xml/codelists.ts:43
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
File: src/lib/types/define-xml/codelists.ts:14
```typescript
export interface CodeListAlias {
	Name: string | null;
	Context: string | null;
}
```

#### CodeListDecode (interface)
File: src/lib/types/define-xml/codelists.ts:6
```typescript
export interface CodeListDecode {
	TranslatedText: string | null;
	lang: string | null;
}
```

#### CodeListItem (interface)
File: src/lib/types/define-xml/codelists.ts:22
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

#### DefineXml (interface)
File: src/lib/types/define-xml/documents.ts:26
```typescript
export interface DefineXml {
	study: Study;
	metaData: MetaData;
	standards: Standard[];
	itemGroups: ItemGroup[];
	methods: method[];
	itemDefs: itemDef[];
	itemRefs: itemRef[];
	comments: Comment[];
	CodeLists: CodeList[];
	whereClauseDefs: whereClauseDef[];
	valueListDefs: valueListDef[];
	Dictionaries: Dictionary[];
	Documents: Document[];
	AnalysisResults: AnalysisResult[];
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
	leafID: string;
	title?: string | null;
	href?: string | null;
	type?: string | null;
	pageRefs?: string | null;
	firstPage?: string | null;
	lastPage?: string | null;
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
File: src/lib/types/define-xml/codelists.ts:34
```typescript
export interface EnumeratedItem {
	CodedValue: string | null;
	OrderNumber: string | null;
	Aliases: CodeListAlias[];
}
```

#### itemDef (interface)
File: src/lib/types/define-xml/variables.ts:8
```typescript
export interface itemDef extends BaseDefineEntity, DocumentReference, Commentable {
	/** The dataset this item belongs to */
	Dataset: string | null;

	/** SAS field name */
	SASFieldName: string | null;

	/** Data type of the variable */
	DataType: string | null;

	/** Length of the variable */
	Length: string | null;

	/** Origin type (e.g., 'Derived', 'Assigned') */
	OriginType: string | null;

	/** Origin details */
	Origin: string | null;

	/** Source of the origin */
	OriginSource: string | null;

	/** Reference to associated codelist */
	CodeListOID: string | null;

	/** Number of significant digits */
	SignificantDigits: string | null;

	/** Display format */
	Format: string | null;

	/** Assigned value if any */
	AssignedValue: string | null;

	/** Whether this is a common variable */
	Common: boolean | null;

	/** Developer notes */
	DeveloperNotes: string | null;
}
```

#### ItemGroup (interface)
File: src/lib/types/define-xml/groups.ts:9
```typescript
export interface ItemGroup extends BaseDefineEntity, ReferenceProperties, Commentable {
	/** SAS dataset name */
	SASDatasetName: string | null;

	/** Whether the group is repeating */
	Repeating: string | null;

	/** Purpose of the dataset */
	Purpose: string | null;

	/** Whether this is reference data */
	IsReferenceData: string | null;

	/** Reference to the standard */
	StandardOID: string | null;

	/** Structure type */
	Structure: string | null;

	/** Archive location ID */
	ArchiveLocationID: string | null;

	/** Dataset class */
	Class: string | null;

	/** Key variables in the dataset */
	KeyVariables?: string | null;

	/** Developer notes */
	DeveloperNotes?: string | null;

	/** Dataset label */
	Label?: string | null;

	/** References to items in this group */
	ItemRefs?: ItemRef[];
}
```

#### itemRef (interface)
File: src/lib/types/define-xml/variables.ts:52
```typescript
export interface itemRef extends BaseDefineEntity {
	/** Whether the item is mandatory */
	Mandatory: string | null;

	/** Order number in the group */
	OrderNumber: string | null;

	/** Reference to associated method */
	MethodOID: string | null;

	/** Reference to where clause */
	WhereClauseOID: string | null;

	/** Key sequence number if part of key */
	KeySequence: string | null;
}
```

#### MetaData (interface)
File: src/lib/types/define-xml/base.ts:18
```typescript
export interface MetaData {
	OID: string | null;
	name: string | null;
	description: string | null;
	defineVersion: string | null;
}
```

#### method (interface)
File: src/lib/types/define-xml/methods.ts:8
```typescript
export interface method extends BaseDefineEntity {
	/** Type of the method */
	Type: string | null;

	/** Description from TranslatedText */
	Description: string | null;

	/** DocumentRef leafID reference */
	Document: string | null;

	/** PDFPageRef PageRefs */
	Pages: string | null;
}
```

#### MethodInfo (interface)
File: src/lib/types/define-xml/methods.ts:25
```typescript
export interface MethodInfo {
	type: string | null;
	description: string | null;
	document?: string;
	translatedText?: string | null;
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
	name: string | null;
	description: string | null;
	protocolName: string | null;
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
	content: string;
	lang?: string;
}
```

#### valueListDef (interface)
File: src/lib/types/define-xml/valuelists.ts:19
```typescript
export interface valueListDef {
	OID: string | null;
	ItemRefs: ValueListItemRef[];
}
```

#### ValueListDef (interface)
File: src/lib/types/define-xml/groups.ts:50
```typescript
export interface ValueListDef extends BaseDefineEntity {
	/** References to items in this value list */
	ItemRefs: {
		ItemOID: string | null;
		Mandatory: string | null;
		OrderNumber: string | null;
		MethodOID: string | null;
		WhereClauseOID: string | null;
	}[];

	/** Value list label */
	Label?: string | null;

	/** Data type for the values */
	DataType?: string | null;

	/** Length specification */
	Length?: string | null;

	/** Significant digits */
	SignificantDigits?: string | null;

	/** Display format */
	Format?: string | null;

	/** Assigned value if any */
	AssignedValue?: string | null;

	/** Page references */
	Pages?: string | null;

	/** Predecessor information */
	Predecessor?: string | null;

	/** Developer notes */
	DeveloperNotes?: string | null;
}
```

#### ValueListItemRef (interface)
File: src/lib/types/define-xml/valuelists.ts:7
```typescript
export interface ValueListItemRef {
	ItemOID: string | null;
	Mandatory: string | null;
	OrderNumber: string | null;
	MethodOID: string | null;
	WhereClauseOID: string | null;
}
```

#### whereClauseDef (interface)
File: src/lib/types/define-xml/variables.ts:72
```typescript
export interface whereClauseDef extends BaseDefineEntity {
	/** Comparator for the range check (e.g., 'EQ', 'NE', 'IN') */
	Comparator: string | null;

	/** Indicates if this is a soft or hard range check */
	SoftHard: string | null;

	/** Reference to the item being checked */
	ItemOID: string | null;

	/** The value(s) to check against */
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
