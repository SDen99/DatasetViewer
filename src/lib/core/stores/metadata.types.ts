import type { itemDef, method, comment, CodeList } from '../processors/defineXML/types';

export interface VariableDisplayProps {
	variable: itemDef;
	methodOID?: string | null;
	hasVLM?: boolean;
	orderNumber?: string;
	keySequence?: string;
	mandatory?: string;
}

export interface MethodDisplayProps {
	methodOID: string;
	methods: method[];
	comments: comment[];
	codeLists: CodeList[];
	itemDef?: itemDef;
	isExpanded: boolean;
	onToggle: () => void;
}
