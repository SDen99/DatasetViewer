// src/lib/utils/defineXML/baseUtils.ts

import type { Study, MetaData } from '$lib/types/define-xml';

export const baseUtils = {
	/**
	 * Create a new Study instance
	 */
	createStudy: (oid: string): Study => ({
		OID: oid,
		Name: null,
		Description: null,
		ProtocolName: null
	}),

	/**
	 * Create new MetaData instance
	 */
	createMetaData: (oid: string): MetaData => ({
		OID: oid,
		Name: null,
		Description: null,
		DefineVersion: null
	})
};
