// src/lib/utils/defineXML/analysisUtils.ts

import type { AnalysisResult } from '$lib/types/define-xml/analysis';

export const analysisUtils = {
	/**
	 * Create a new AnalysisResult with default values
	 */
	createAnalysisResult: (oid: string): AnalysisResult => ({
		OID: oid,
		Name: null,
		Description: null,
		Display: null,
		ID: null,
		Variables: null,
		Reason: null,
		Purpose: null,
		SelectionCriteria: null,
		JoinComment: null,
		Documentation: null,
		DocumentationRefs: null,
		ProgrammingContext: null,
		ProgrammingCode: null,
		ProgrammingDocument: null,
		Pages: null,
		Document: undefined
	}),

	/**
	 * Get variables involved in an analysis as an array
	 */
	getAnalysisVariables: (analysis: AnalysisResult): string[] => {
		return analysis.Variables?.split(/\s*,\s*/).filter(Boolean) || [];
	},

	/**
	 * Check if an analysis has programming code
	 */
	hasProgrammingCode: (analysis: AnalysisResult): boolean => {
		return Boolean(analysis.ProgrammingCode || analysis.ProgrammingDocument);
	}
};
