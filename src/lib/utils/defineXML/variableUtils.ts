// src/lib/utils/defineXML/variableUtils.ts

import type { ItemDef, ItemRef } from '$lib/types/define-xml';
import { baseUtils } from './baseUtils';

export const variableUtils = {
	/**
	 * Check if a variable is derived
	 */
	isDerived(itemDef: ItemDef): boolean {
		return itemDef.OriginType === 'Derived';
	},

	/**
	 * Get the effective data type (handles aliases)
	 */
	getEffectiveDataType(itemDef: ItemDef): string {
		const dataType = itemDef.DataType?.toUpperCase();
		switch (dataType) {
			case 'INTEGER':
			case 'FLOAT':
				return 'numeric';
			case 'TEXT':
			case 'STRING':
				return 'text';
			default:
				return dataType || 'unknown';
		}
	},

	/**
	 * Check if an object is an ItemDef
	 */
	isItemDef(obj: any): obj is ItemDef {
		return baseUtils.isBaseDefineEntity(obj) && 'Dataset' in obj && 'DataType' in obj;
	},

	/**
	 * Check if an object is an ItemRef
	 */
	isItemRef(obj: any): obj is ItemRef {
		return baseUtils.isBaseDefineEntity(obj) && 'Mandatory' in obj && 'OrderNumber' in obj;
	}
};
