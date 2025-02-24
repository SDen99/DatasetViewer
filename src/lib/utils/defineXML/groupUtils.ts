// src/lib/utils/defineXML/groupUtils.ts

import type { ItemGroup, ItemRef } from '$lib/types/define-xml';

export const groupUtils = {
	/**
	 * Check if a group is a repeating group
	 */
	isRepeating: (group: ItemGroup): boolean => {
		return group.Repeating?.toLowerCase() === 'yes';
	},

	/**
	 * Create a new ItemGroup with default values
	 */
	createItemGroup: (oid: string): ItemGroup => ({
		OID: oid,
		Name: null,
		Description: null,
		SASDatasetName: null,
		Repeating: null,
		Purpose: null,
		IsReferenceData: null,
		StandardOID: null,
		Structure: null,
		ArchiveLocationID: null,
		CommentOID: null,
		Class: null,
		ItemRefs: []
	}),

	/**
	 * Get sorted items from a group
	 */
	getSortedItems: (group: ItemGroup): ItemRef[] => {
		return [...(group.ItemRefs || [])].sort((a, b) => {
			const orderA = parseInt(a.OrderNumber || '0');
			const orderB = parseInt(b.OrderNumber || '0');
			return orderA - orderB;
		});
	}
};
