import type {
	ParsedDefineXML,
	Study,
	Standard,
	MetaData,
	ItemGroup,
	itemDef,
	itemRef,
	method,
	comment,
	CodeList,
	whereClauseDef,
	valueListDef,
	Dictionary,
	Document,
	AnalysisResult
} from '$lib/core/processors/defineXML/types';

export type { ParsedDefineXML } from './types';

export const parseDefineXML = async (xmlString: string): Promise<ParsedDefineXML> => {
	// Input validation
	if (!xmlString || typeof xmlString !== 'string') {
		throw new Error('Invalid input: XML string required');
	}

	const parser = new DOMParser();
	const xmlDoc = parser.parseFromString(xmlString, 'application/xml');

	// Enhanced error handling
	const parseErrors = xmlDoc.getElementsByTagName('parsererror');
	if (parseErrors.length > 0) {
		const errorMessage = parseErrors[0].textContent || 'Unknown parsing error';
		throw new Error(`XML parsing error: ${errorMessage}`);
	}

	// Helper function with stronger typing
	function getTextContent(element: Element | null, selector: string): string | null {
		if (!element) return null;
		const targetElement = element.querySelector(selector);
		return targetElement?.textContent ?? null;
	}

	// Helper function for safe attribute extraction
	function getAttribute(element: Element | null, attributeName: string): string | null {
		return element?.getAttribute(attributeName) ?? null;
	}

	function getDefContent(element: Element, path: string): string | null {
		const namespaceURI = element.ownerDocument?.documentElement.getAttributeNS(
			'http://www.w3.org/2000/xmlns/',
			'def'
		);
		if (!namespaceURI) return null;

		const defElement = element.getElementsByTagNameNS(namespaceURI, path)[0];
		return defElement?.textContent ?? null;
	}

	// Extract namespace with better error handling
	const namespaceURI = xmlDoc.documentElement.getAttributeNS(
		'http://www.w3.org/2000/xmlns/',
		'def'
	);
	if (!namespaceURI) {
		throw new Error("Required namespace 'def' not found in XML");
	}

	///////////////////////////////////////////////////////////////////////
	// Start the meat of the parsing
	///////////////////////////////////////////////////////////////////////

	// Extract study details
	const studyElement = xmlDoc.querySelector('Study');
	const study: Study = {
		OID: getAttribute(studyElement, 'OID'),
		name: getTextContent(xmlDoc.documentElement, 'StudyName'),
		description: getTextContent(xmlDoc.documentElement, 'StudyDescription'),
		protocolName: getTextContent(xmlDoc.documentElement, 'ProtocolName')
	};

	// MetaDataVersion extraction with validation
	const metaDataVersion = xmlDoc.querySelector('MetaDataVersion');
	if (!metaDataVersion) {
		throw new Error("Required element 'MetaDataVersion' not found");
	}

	const metaData: MetaData = {
		OID: getAttribute(metaDataVersion, 'OID'),
		name: getAttribute(metaDataVersion, 'Name'),
		description: getAttribute(metaDataVersion, 'Description'),
		defineVersion: getAttribute(metaDataVersion, 'def:DefineVersion')
	};

	// Extract standards
	const standards: Standard[] = Array.from(
		metaDataVersion.getElementsByTagNameNS(namespaceURI, 'Standard')
	).map((standard) => ({
		OID: getAttribute(standard, 'OID'),
		Name: getAttribute(standard, 'Name'),
		Type: getAttribute(standard, 'Type'),
		Status: getAttribute(standard, 'Status'),
		Version: getAttribute(standard, 'Version'),
		PublishingSet: getAttribute(standard, 'PublishingSet'),
		CommentOID: getAttribute(standard, 'def:CommentOID')
	}));

	// Extract ItemGroups
	const itemGroups: ItemGroup[] = Array.from(metaDataVersion.querySelectorAll('ItemGroupDef')).map(
		(group) => ({
			OID: getAttribute(group, 'OID'),
			Name: getAttribute(group, 'Name'),
			SASDatasetName: getAttribute(group, 'SASDatasetName'),
			Repeating: getAttribute(group, 'Repeating'),
			Purpose: getAttribute(group, 'Purpose'),
			IsReferenceData: getAttribute(group, 'IsReferenceData'),
			StandardOID: getAttribute(group, 'def:StandardOID'),
			Structure: getAttribute(group, 'def:Structure'),
			ArchiveLocationID: getAttribute(group, 'def:ArchiveLocationID'),
			CommentOID: getAttribute(group, 'def:CommentOID'),
			Description: getTextContent(group, 'Description'),
			Class:
				group.getAttribute('def:Class') ||
				group.querySelector('Class')?.getAttribute('Name') ||
				null // Add null as fallback
		})
	);

	// Extract ItemDefs
	const itemDefs: itemDef[] = Array.from(metaDataVersion.querySelectorAll('ItemDef')).map(
		(item) => ({
			OID: getAttribute(item, 'OID') || null,
			Dataset: getAttribute(item, 'OID')?.split('.')[1] || null,
			Name: getAttribute(item, 'Name') || null,
			SASFieldName: getAttribute(item, 'SASFieldName') || null,
			DataType: getAttribute(item, 'DataType') || null,
			Length: getAttribute(item, 'Length') || null,
			Description: item.querySelector('Description TranslatedText')?.textContent || null,
			OriginType: item.querySelector('Origin')?.getAttribute('Type') || null,
			Origin: item.querySelector('Origin Description TranslatedText')?.textContent || null,
			OriginSource: item.querySelector('Origin')?.getAttribute('Source') || null,
			CodeListOID: item.querySelector('CodeListRef')?.getAttribute('CodeListOID') || null,
			SignificantDigits: getAttribute(item, 'SignificantDigits') || null,
			Format: getAttribute(item, 'def:DisplayFormat') || null,
			// Mandatory: getAttribute(item, "Mandatory") || null, In ItemRef not Def
			AssignedValue: getAttribute(item, 'def:AssignedValue') || null,
			Common: getAttribute(item, 'def:Common') === 'Yes' || null,
			Pages: getAttribute(item, 'def:Pages') || null,
			// Method: getDefContent(item, "Method") || null, In ItemRef not Def
			Comment: getAttribute(item, 'def:CommentOID') || null,
			DeveloperNotes: getDefContent(item, 'DeveloperNotes') || null // Not sure if it exists
		})
	);

	const methods: method[] = Array.from(metaDataVersion.querySelectorAll('MethodDef')).map(
		(method) => ({
			OID: getAttribute(method, 'OID') || null,
			Name: getAttribute(method, 'Name') || null,
			Type: getAttribute(method, 'Type') || null,
			Description: method.querySelector('Description TranslatedText')?.textContent || null,
			Document: method.querySelector('def\\:DocumentRef')?.getAttribute('leafID') || null,
			Pages:
				method.querySelector('def\\:DocumentRef def\\:PDFPageRef')?.getAttribute('PageRefs') || null
		})
	);

	const comments: comment[] = Array.from(metaDataVersion.querySelectorAll('CommentDef')).map(
		(method) => ({
			OID: method.getAttribute('OID') || null,
			Description: method.querySelector('Description TranslatedText')?.textContent || null
		})
	);

	const itemRefs: itemRef[] = Array.from(metaDataVersion.querySelectorAll('ItemRef')).map(
		(item) => ({
			OID: getAttribute(item, 'ItemOID') || null,
			Mandatory: getAttribute(item, 'Mandatory') || null,
			OrderNumber: getAttribute(item, 'OrderNumber') || null,
			MethodOID: getAttribute(item, 'MethodOID') || null,
			WhereClauseOID:
				item
					.getElementsByTagNameNS(namespaceURI, 'WhereClauseRef')[0]
					?.getAttribute('WhereClauseOID') || null
		})
	);

	const CodeLists: CodeList[] = Array.from(metaDataVersion.querySelectorAll('CodeList'))
		.filter((codeList) => !codeList.querySelector('ExternalCodeList'))
		.map((codeList) => ({
			OID: codeList.getAttribute('OID') || null,
			Name: codeList.getAttribute('Name') || null,
			DataType: codeList.getAttribute('DataType') || null,
			IsNonStandard:
				codeList.getAttribute('def:IsNonStandard') ||
				codeList.getAttribute('def:StandardOID') ||
				null,
			// Add these properties
			CodeListItems: Array.from(codeList.querySelectorAll('CodeListItem')).map((item) => ({
				CodedValue: item.getAttribute('CodedValue'),
				OrderNumber: item.getAttribute('OrderNumber'),
				Decode: {
					TranslatedText: item.querySelector('Decode TranslatedText')?.textContent || null
				}
			})),
			EnumeratedItems: Array.from(codeList.querySelectorAll('EnumeratedItem')).map((item) => ({
				CodedValue: item.getAttribute('CodedValue'),
				OrderNumber: item.getAttribute('OrderNumber')
			}))
		}));

	const Dictionaries: Dictionary[] = Array.from(metaDataVersion.querySelectorAll('CodeList'))
		.filter((codeList) => codeList.querySelector('ExternalCodeList'))
		.map((codeList) => {
			const externalCodeList = codeList.querySelector('ExternalCodeList');

			return {
				OID: codeList.getAttribute('OID') || null,
				Name: codeList.getAttribute('Name') || null,
				DataType: codeList.getAttribute('DataType') || null,
				Dictionary: externalCodeList?.getAttribute('Dictionary') || null,
				Version: externalCodeList?.getAttribute('Version') || null
			};
		});

	const whereClauseDefs: whereClauseDef[] = Array.from(
		metaDataVersion.getElementsByTagNameNS(namespaceURI, 'WhereClauseDef')
	).flatMap((wcd) => {
		const OID = wcd.getAttribute('OID') || null;
		return Array.from(wcd.querySelectorAll('RangeCheck')).map((rc) => ({
			OID,
			Comparator: rc.getAttribute('Comparator') || null,
			SoftHard: rc.getAttribute('SoftHard') || null,
			ItemOID: rc.getAttribute('def:ItemOID') || null,
			CheckValues: getTextContent(rc, 'CheckValue')
		}));
	});

	const valueListDefs: valueListDef[] = Array.from(
		metaDataVersion.getElementsByTagNameNS(namespaceURI, 'ValueListDef')
	).map((vld) => {
		// Get the basic ValueListDef attributes
		const valueListDef = {
			OID: vld.getAttribute('OID') || null,
			// Map ItemRefs array properly handling namespaces
			ItemRefs: Array.from(vld.children)
				.filter((child) => child.localName === 'ItemRef')
				.map((ir) => ({
					ItemOID: ir.getAttribute('ItemOID') || null,
					Mandatory: ir.getAttribute('Mandatory') || null,
					OrderNumber: ir.getAttribute('OrderNumber') || null,
					MethodOID: ir.getAttribute('MethodOID') || null,
					// Find WhereClauseRef using namespace
					WhereClauseOID:
						Array.from(ir.children)
							.find(
								(child) =>
									child.localName === 'WhereClauseRef' && child.namespaceURI === namespaceURI
							)
							?.getAttribute('WhereClauseOID') || null
				}))
		};

		console.log('Parsed ValueListDef:', {
			OID: valueListDef.OID,
			ItemRefCount: valueListDef.ItemRefs.length,
			ItemRefs: valueListDef.ItemRefs
		});

		return valueListDef;
	});

	const Documents: Document[] = Array.from(metaDataVersion.children)
		.filter((child) => child.nodeName === 'def:leaf')
		.map((leaf) => ({
			ID: leaf.getAttribute('ID') || null,
			Title: leaf.getElementsByTagNameNS(namespaceURI, 'title')[0]?.textContent || null,
			Href: leaf.getAttributeNS('http://www.w3.org/1999/xlink', 'href') || null
		}));

	const AnalysisResults = Array.from(
		metaDataVersion.getElementsByTagNameNS('http://www.cdisc.org/ns/arm/v1.0', 'AnalysisResult')
	).map((analysis) => {
		// Get description from the first TranslatedText under Description
		const description =
			analysis.getElementsByTagName('Description')[0]?.getElementsByTagName('TranslatedText')[0]
				?.textContent || null;

		// Get variables from AnalysisVariable elements
		const variables = Array.from(analysis.getElementsByTagName('AnalysisVariable'))
			.map((v) => v.getAttribute('ItemOID'))
			.filter((v) => v)
			.join(', ');

		// Get documentation section
		const documentation =
			analysis.getElementsByTagName('Documentation')[0]?.getElementsByTagName('TranslatedText')[0]
				?.textContent || null;

		// Get document references from Documentation section
		const docRefs = Array.from(
			analysis.getElementsByTagName('Documentation')[0]?.getElementsByTagName('def:DocumentRef') ||
				[]
		)
			.map((ref) => ref.getAttribute('leafID'))
			.join(', ');

		// Get programming section details
		const programmingSection = analysis.getElementsByTagName('ProgrammingCode')[0];
		const programmingContext = programmingSection?.getAttribute('Context') || null;
		const programmingDoc =
			programmingSection?.getElementsByTagName('def:DocumentRef')[0]?.getAttribute('leafID') ||
			null;

		// Get parent ResultDisplay info by walking up the DOM
		let currentNode = analysis.parentNode;
		let displayName = null;
		while (currentNode && currentNode.nodeType === Node.ELEMENT_NODE) {
			if ((currentNode as Element).localName === 'ResultDisplay') {
				displayName = (currentNode as Element).getAttribute('Name');
				break;
			}
			currentNode = currentNode.parentNode;
		}

		// Get pages from the ResultDisplay level
		const pages =
			currentNode && currentNode.nodeType === Node.ELEMENT_NODE
				? Array.from((currentNode as Element).getElementsByTagName('PDFPageRef'))
						.map((page) => page.getAttribute('PageRefs'))
						.filter((p) => p)
						.join(', ')
				: null;

		return {
			Display: displayName,
			ID: analysis.getAttribute('OID') || null,
			Description: description,
			Variables: variables,
			Reason: analysis.getAttribute('AnalysisReason') || null,
			Purpose: analysis.getAttribute('AnalysisPurpose') || null,
			SelectionCriteria: Array.from(analysis.getElementsByTagName('WhereClauseRef'))
				.map((where) => where.getAttribute('WhereClauseOID'))
				.filter((w) => w)
				.join(', '),
			JoinComment: null,
			Documentation: documentation,
			DocumentationRefs: docRefs,
			ProgrammingContext: programmingContext,
			ProgrammingCode: null,
			ProgrammingDocument: programmingDoc,
			Pages: pages
		} as AnalysisResult;
	});

	const result: ParsedDefineXML = {
		study,
		metaData,
		standards,
		itemGroups,
		methods,
		itemDefs,
		itemRefs,
		comments,
		CodeLists,
		whereClauseDefs,
		valueListDefs,
		Dictionaries,
		Documents,
		AnalysisResults
	};

	return result;
};
