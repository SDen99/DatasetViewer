// src/lib/types/define-xml/analysis.ts

/**
 * Represents a display for analysis results
 * Maps to arm:ResultDisplay elements
 */
export interface AnalysisDisplay {
	ID: string | null;
	Title: string | null;
	Document: string | null;
	Pages: string | null;
}

/**
 * Represents an analysis result in Define-XML
 * Maps to arm:AnalysisResult elements
 */
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

/**
 * Represents an analysis dataset reference
 * Maps to arm:AnalysisDataset elements
 */
export interface AnalysisDataset {
	ItemGroupOID: string;
	WhereClauseRefs?: Array<{
		WhereClauseOID: string;
	}>;
}

/**
 * Represents analysis variable references
 * Maps to arm:AnalysisVariable elements
 */
export interface AnalysisVariable {
	ItemOID: string;
	WhereClauseRefs?: Array<{
		WhereClauseOID: string;
	}>;
}
