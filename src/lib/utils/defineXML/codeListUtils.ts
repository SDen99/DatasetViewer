// src/lib/utils/codeListUtils.ts

import type { CodeList } from '$lib/types/define-xml/codelists';

/**
 * General utility functions for working with CodeLists
 */
export const codeListUtils = {
	/**
	 * Get the decoded (human readable) value for a coded value
	 */
	findDecode(codeList: CodeList | undefined, codedValue: string): string | null {
		if (!codeList?.CodeListItems) return null;
		const item = codeList.CodeListItems.find((item) => item.CodedValue === codedValue);
		return item?.Decode?.TranslatedText || null;
	},

	/**
	 * Get all valid values from a CodeList
	 */
	getValidValues(codeList: CodeList): string[] {
		const values: string[] = [];

		if (codeList.CodeListItems) {
			values.push(
				...codeList.CodeListItems.map((item) => item.CodedValue).filter(
					(value): value is string => value !== null
				)
			);
		}

		if (codeList.EnumeratedItems) {
			values.push(
				...codeList.EnumeratedItems.map((item) => item.CodedValue).filter(
					(value): value is string => value !== null
				)
			);
		}

		return values;
	},

	/**
	 * Check if a CodeList uses enumerated items
	 */
	isEnumerated(codeList: CodeList): boolean {
		return codeList.EnumeratedItems?.length > 0;
	}
};
