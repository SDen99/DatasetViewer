import type { Study, MetaData, Standard, DocumentRef, Comment } from '$lib/types/define-xml';
import type { Method, ItemGroup, ItemDef, ItemRef, CodeList } from '$lib/types/define-xml';
import type {
	Dictionary,
	ValueListDef,
	AnalysisResult,
	WhereClauseDef,
	RangeCheck,
	ComparatorType
} from '$lib/types/define-xml';
import type { ParsedDefineXML } from '$lib/types/define-xml';

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

	function isValidComparator(value: string): value is ComparatorType {
		return ['EQ', 'NE', 'LT', 'LE', 'GT', 'GE', 'IN', 'NOTIN'].includes(value);
	}

	///////////////////////////////////////////////////////////////////////
	// Start the meat of the parsing
	///////////////////////////////////////////////////////////////////////

	// Extract study details
	const studyElement = xmlDoc.querySelector('Study');
	const Study: Study = {
		OID: getAttribute(studyElement, 'OID'),
		Name: getTextContent(xmlDoc.documentElement, 'StudyName'),
		Description: getTextContent(xmlDoc.documentElement, 'StudyDescription'),
		ProtocolName: getTextContent(xmlDoc.documentElement, 'ProtocolName')
	};

	// MetaDataVersion extraction with validation
	const metaDataVersion = xmlDoc.querySelector('MetaDataVersion');
	if (!metaDataVersion) {
		throw new Error("Required element 'MetaDataVersion' not found");
	}

	const MetaData: MetaData = {
		OID: getAttribute(metaDataVersion, 'OID'),
		Name: getAttribute(metaDataVersion, 'Name'),
		Description: getAttribute(metaDataVersion, 'Description'),
		DefineVersion: getAttribute(metaDataVersion, 'def:DefineVersion')
	};

	// Extract standards
	const Standards: Standard[] = Array.from(
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
	const ItemGroups: ItemGroup[] = Array.from(metaDataVersion.querySelectorAll('ItemGroupDef')).map(
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
	const ItemDefs: ItemDef[] = Array.from(metaDataVersion.querySelectorAll('ItemDef')).map(
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
			HasNoData: getAttribute(item, 'HasNoData') || null,
			AssignedValue: getAttribute(item, 'def:AssignedValue') || null,
			Common: getAttribute(item, 'def:Common') === 'Yes' || null,
			Pages: getAttribute(item, 'def:Pages') || null,
			DisplayFormat: getAttribute(item, 'def:DisplayFormat') || null,
			CommentOID: getAttribute(item, 'def:CommentOID') || null,
			DeveloperNotes: getDefContent(item, 'DeveloperNotes') || null // Added DeveloperNotes (but I don't think it exists)
		})
	);

	const Methods: Method[] = Array.from(metaDataVersion.querySelectorAll('MethodDef')).map(
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

	const Comments: Comment[] = Array.from(metaDataVersion.querySelectorAll('CommentDef')).map(
		(method) => ({
			OID: method.getAttribute('OID') || null,
			Description: method.querySelector('Description TranslatedText')?.textContent || null
		})
	);

	const ItemRefs: ItemRef[] = Array.from(
		metaDataVersion.querySelectorAll('ItemGroupDef > ItemRef')
	).map((item) => ({
		ItemOID: getAttribute(item, 'ItemOID') || null,
		OID: getAttribute(item, 'ItemOID') || null, // to remove at some point ... ..
		Mandatory: getAttribute(item, 'Mandatory') || null,
		OrderNumber: getAttribute(item, 'OrderNumber') || null,
		MethodOID: getAttribute(item, 'MethodOID') || null,
		Role: getAttribute(item, 'Role') || null,
		WhereClauseOID:
			item
				.getElementsByTagNameNS(namespaceURI, 'WhereClauseRef')[0]
				?.getAttribute('WhereClauseOID') || null,
		KeySequence: getAttribute(item, 'KeySequence') || null,
		RoleCodeListOID: getAttribute(item, 'RoleCodeListOID') || null
	}));

	const CodeLists: CodeList[] = Array.from(metaDataVersion.querySelectorAll('CodeList'))
		.filter((codeList) => !codeList.querySelector('ExternalCodeList'))
		.map((codeList) => ({
			OID: getAttribute(codeList, 'OID') || null,
			Name: getAttribute(codeList, 'Name') || null,
			DataType: getAttribute(codeList, 'DataType') || null,
			SASFormatName: getAttribute(codeList, 'SASFormatName') || null,
			StandardOID: getAttribute(codeList, 'def:StandardOID') || null,
			IsNonStandard: getAttribute(codeList, 'def:IsNonStandard') || null,
			ExtendedValue: getAttribute(codeList, 'def:ExtendedValue') === 'Yes' ? true : null,

			// Parse CodeListItems
			CodeListItems: Array.from(codeList.querySelectorAll('CodeListItem')).map((item) => ({
				CodedValue: getAttribute(item, 'CodedValue'),
				OrderNumber: getAttribute(item, 'OrderNumber'),
				Rank: getAttribute(item, 'Rank'),
				ExtendedValue: getAttribute(item, 'def:ExtendedValue') === 'Yes',
				Decode: item.querySelector('Decode')
					? {
							TranslatedText: item.querySelector('Decode TranslatedText')?.textContent || null,
							Lang: item.querySelector('Decode TranslatedText')?.getAttribute('xml:lang') || null
						}
					: null,
				Aliases: Array.from(item.querySelectorAll('Alias')).map((alias) => ({
					Name: getAttribute(alias, 'Name'),
					Context: getAttribute(alias, 'Context')
				}))
			})),

			// Parse EnumeratedItems
			EnumeratedItems: Array.from(codeList.querySelectorAll('EnumeratedItem')).map((item) => ({
				CodedValue: getAttribute(item, 'CodedValue'),
				OrderNumber: getAttribute(item, 'OrderNumber'),
				Aliases: Array.from(item.querySelectorAll('Alias')).map((alias) => ({
					Name: getAttribute(alias, 'Name'),
					Context: getAttribute(alias, 'Context')
				}))
			})),

			// Parse CodeList level Aliases
			Aliases: Array.from(codeList.querySelectorAll(':scope > Alias')).map((alias) => ({
				Name: getAttribute(alias, 'Name'),
				Context: getAttribute(alias, 'Context')
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

	const WhereClauseDefs: WhereClauseDef[] = Array.from(
		metaDataVersion.getElementsByTagNameNS(namespaceURI, 'WhereClauseDef')
	).map((wcd): WhereClauseDef => {
		const OID = wcd.getAttribute('OID');
		if (!OID) {
			throw new Error('WhereClauseDef must have an OID');
		}

		// Enhanced OID parsing
		const oidParts = OID.split('.');
		const isADaMDef = oidParts[1]?.startsWith('AD');
		const context = {
			domain: oidParts[1],
			variables: [] as string[],
			operations: [] as string[],
			values: [] as string[]
		};

		// Parse compound OIDs
		for (let i = 2; i < oidParts.length; i += 3) {
			if (oidParts[i] && oidParts[i + 1] && oidParts[i + 2]) {
				context.variables.push(oidParts[i]);
				context.operations.push(oidParts[i + 1]);
				context.values.push(oidParts[i + 2]);
			}
		}

		console.log('Processing WhereClauseDef:', { OID, context });

		const CommentOID = wcd.getAttribute('def:CommentOID') || null;
		const rangeChecks = Array.from(wcd.querySelectorAll('RangeCheck'));

		const RangeChecks = rangeChecks.map((rc): RangeCheck => {
			const originalComparator = rc.getAttribute('Comparator');
			const originalSoftHard = rc.getAttribute('SoftHard');
			const ItemOID = rc.getAttribute('def:ItemOID');

			// Get CheckValues with namespace awareness
			const checkValueElements = Array.from(
				rc.getElementsByTagNameNS(namespaceURI, 'CheckValue')
			).concat(Array.from(rc.querySelectorAll('CheckValue'))); // Try both namespace and non-namespace

			let CheckValues = checkValueElements
				.map((element) => element.textContent?.trim())
				.filter((value): value is string => value !== null && value !== undefined && value !== '');

			if (!originalComparator || !ItemOID) {
				console.warn(`Invalid RangeCheck in WhereClauseDef ${OID}: missing required attributes`);
				return {
					Comparator: 'EQ' as ComparatorType,
					SoftHard: 'Soft' as 'Soft' | 'Hard',
					ItemOID: ItemOID || '',
					CheckValues: []
				};
			}

			const validComparator = isValidComparator(originalComparator)
				? originalComparator
				: (console.warn(
						`Invalid Comparator "${originalComparator}" in WhereClauseDef ${OID}, using EQ`
					),
					'EQ' as ComparatorType);

			const validSoftHard =
				originalSoftHard && ['Soft', 'Hard'].includes(originalSoftHard)
					? (originalSoftHard as 'Soft' | 'Hard')
					: ('Soft' as 'Soft' | 'Hard');

			// If no CheckValues found, try to infer from OID
			if (CheckValues.length === 0) {
				// For laboratory-related conditions
				if (context.domain === 'ADLB') {
					// Handle PARCAT1 values
					if (context.variables.includes('PARCAT1')) {
						const parcat1Index = context.variables.indexOf('PARCAT1');
						const rawValue = context.values[parcat1Index];
						// Split compound categories
						CheckValues = rawValue
							.split(/(?=[A-Z])/)
							.filter(Boolean)
							.map((v) => v.toUpperCase());
					}
					// Handle other lab-specific variables
					else if (context.variables.some((v) => v.startsWith('LB'))) {
						CheckValues = context.values;
					}
				}
				// For missing values
				else if (context.operations.includes('MISSING')) {
					CheckValues = [''];
				}
				// For visit values
				else if (context.values.some((v) => v.includes('Week') || v.includes('Baseline'))) {
					CheckValues = context.values[0].split(/(?=[A-Z])/g).filter(Boolean);
				}
				// For PARAMCD values
				else if (context.variables.includes('PARAMCD')) {
					CheckValues = [context.values[context.variables.indexOf('PARAMCD')]];
				}
				// For analysis flags
				else if (context.variables.some((v) => v.endsWith('FL'))) {
					CheckValues = ['Y'];
				}
				// For date comparisons
				else if (context.variables.some((v) => v.endsWith('DT'))) {
					const dtIndex = context.variables.findIndex((v) => v.endsWith('DT'));
					CheckValues =
						context.operations[dtIndex] === 'MISSING' ? [''] : [context.values[dtIndex]];
				}
				// Default case - use the last value from context if available
				else if (context.values.length > 0) {
					CheckValues = [context.values[context.values.length - 1]];
				}

				if (CheckValues.length > 0) {
					console.log(`Inferred CheckValues for ${OID}:`, CheckValues);
				} else {
					console.warn(`Unable to infer CheckValues for WhereClauseDef ${OID}`);
				}
			}

			return {
				Comparator: validComparator,
				SoftHard: validSoftHard,
				ItemOID,
				CheckValues
			};
		});

		return {
			OID,
			CommentOID,
			RangeChecks
		};
	});

	const ValueListDefs: ValueListDef[] = Array.from(
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

	const Documents: DocumentRef[] = Array.from(metaDataVersion.children)
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

	console.log({
		Study,
		MetaData,
		Standards,
		ItemGroups,
		Methods,
		ItemDefs,
		ItemRefs,
		Comments,
		CodeLists,
		WhereClauseDefs,
		ValueListDefs,
		Dictionaries,
		Documents,
		AnalysisResults
	});

	const result: ParsedDefineXML = {
		Study,
		MetaData,
		Standards,
		ItemGroups,
		Methods,
		ItemDefs,
		ItemRefs,
		Comments,
		CodeLists,
		WhereClauseDefs,
		ValueListDefs,
		Dictionaries,
		Documents,
		AnalysisResults
	};

	return result;
};
