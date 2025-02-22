// src/lib/utils/methodUtils.ts

import type { Method, MethodInfo } from '$lib/types/define-xml/methods';

export const methodUtils = {
	/**
	 * Convert a method to MethodInfo format by OID
	 */
	processMethod(methodOID: string, methods: Method[]): MethodInfo | undefined {
		const method = methods.find((m) => m.OID === methodOID);
		return this.toMethodInfo(method);
	},

	/**
	 * Convert a Method to MethodInfo format
	 */
	toMethodInfo(method: Method | undefined): MethodInfo | undefined {
		if (!method) return undefined;

		return {
			type: method.Type,
			description: method.Description,
			document: method.Document,
			translatedText: method.TranslatedText || null
		};
	},

	/**
	 * Create a new Method with default values
	 */
	createMethod(oid: string): Method {
		return {
			OID: oid,
			Name: null,
			Description: null,
			Type: null,
			Document: undefined,
			Pages: null,
			TranslatedText: null
		};
	}
};
