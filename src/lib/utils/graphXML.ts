interface Node {
	id: string;
	group: number;
	label: string;
}

interface Link {
	source: string;
	target: string;
	value: number;
	relationship: string;
}

interface GraphData {
	itemGroups: any[];
	itemDefs: any[];
	methods: any[];
	comments: any[];
	CodeLists: any[];
	standards: any[];
	itemRefs: any[];
	valueListDefs: any[];
	whereClauseDefs: any[];
}

export function graphXML(d: GraphData) {
	const nodes: Node[] = [];
	const links: Link[] = [];
	const nodeSet = new Set<string>();

	// Helper function to add nodes
	function addNodeIfNotExist(entity: { OID: string; label?: string; group?: number }) {
		if (!nodeSet.has(entity.OID)) {
			nodes.push({
				id: entity.OID,
				group: entity.group || 1, // Assign different groups
				label: entity.label || entity.OID // Add labels for better readability
			});
			nodeSet.add(entity.OID);
		}
	}

	// Helper function to add links
	function addLink(source: string, target: string, value: number, relationship: string) {
		addNodeIfNotExist({ OID: source });
		addNodeIfNotExist({ OID: target });

		links.push({
			source,
			target,
			value,
			relationship // Add the type of relationship
		});
	}

	// Extract entities with OID and create nodes
	const entitiesWithOID = [
		...d.itemGroups,
		...d.itemDefs,
		...d.methods,
		...d.comments,
		...d.CodeLists
	];
	entitiesWithOID.forEach(addNodeIfNotExist);

	// Create links between nodes
	const linkSources = [
		{ data: d.standards, targetKey: 'CommentOID' },
		{ data: d.itemGroups, targetKey: 'CommentOID' },
		{ data: d.itemDefs, targetKey: 'CodeListOID' },
		{ data: d.itemRefs, targetKey: 'MethodOID' },
		{ data: d.valueListDefs, targetKey: 'ItemOID', additionalTargetKey: 'MethodOID' },
		{ data: d.whereClauseDefs, targetKey: 'ItemOID' }
	];

	linkSources.forEach(({ data, targetKey, additionalTargetKey }) => {
		data.forEach((item: any) => {
			if (item[targetKey]) {
				addLink(item.OID, item[targetKey], 1, targetKey);
			}
			if (additionalTargetKey && item[additionalTargetKey]) {
				addLink(item.OID, item[additionalTargetKey], 1, additionalTargetKey);
			}
		});
	});

	return { nodes, links };
}
