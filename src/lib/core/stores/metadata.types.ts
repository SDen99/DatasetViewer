import type { ItemDef, Method, Comment, CodeList } from '$lib/types/define-xml';

export interface VariableDisplayProps {
	variable: ItemDef;
	methodOID?: string | null;
	hasVLM?: boolean;
	orderNumber?: string;
	keySequence?: string;
	mandatory?: string;
}

export interface MethodDisplayProps {
	methodOID: string;
	methods: Method[];
	comments: Comment[];
	codeLists: CodeList[];
	itemDef?: ItemDef;
	isExpanded: boolean;
	onToggle: () => void;
}
