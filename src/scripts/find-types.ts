import { writeFileSync, readdirSync, statSync, readFileSync } from 'fs';
import { join, dirname, relative } from 'path';

interface TypeDefinition {
	name: string;
	filePath: string;
	lineNumber: number;
	content: string;
	kind: 'interface' | 'type' | 'enum';
}

interface TypeReport {
	definitions: TypeDefinition[];
	duplicates: {
		name: string;
		locations: {
			filePath: string;
			lineNumber: number;
		}[];
	}[];
}

function findTypeDefinitions(
	dir: string,
	fileExtensions: string[] = ['.ts', '.tsx', '.svelte']
): TypeReport {
	const definitions: TypeDefinition[] = [];
	const typeNameMap = new Map<string, TypeDefinition[]>();

	function searchDirectory(currentDir: string) {
		try {
			const files = readdirSync(currentDir);

			for (const file of files) {
				const filePath = join(currentDir, file);
				const stat = statSync(filePath);

				if (stat.isDirectory()) {
					// Skip node_modules and .svelte-kit
					if (file === 'node_modules' || file === '.svelte-kit') continue;
					searchDirectory(filePath);
					continue;
				}

				if (!fileExtensions.some((ext) => file.endsWith(ext))) {
					continue;
				}

				const content = readFileSync(filePath, 'utf-8');
				const lines = content.split('\n');

				lines.forEach((line, index) => {
					// Match interface definitions
					const interfaceMatch = line.match(/^(?:export\s+)?interface\s+(\w+)/);
					if (interfaceMatch) {
						const def: TypeDefinition = {
							name: interfaceMatch[1],
							filePath: relative(process.cwd(), filePath),
							lineNumber: index + 1,
							content: extractDefinitionContent(lines, index),
							kind: 'interface'
						};
						definitions.push(def);
						addToTypeMap(typeNameMap, def);
					}

					// Match type definitions
					const typeMatch = line.match(/^(?:export\s+)?type\s+(\w+)/);
					if (typeMatch) {
						const def: TypeDefinition = {
							name: typeMatch[1],
							filePath: relative(process.cwd(), filePath),
							lineNumber: index + 1,
							content: extractDefinitionContent(lines, index),
							kind: 'type'
						};
						definitions.push(def);
						addToTypeMap(typeNameMap, def);
					}

					// Match enum definitions
					const enumMatch = line.match(/^(?:export\s+)?enum\s+(\w+)/);
					if (enumMatch) {
						const def: TypeDefinition = {
							name: enumMatch[1],
							filePath: relative(process.cwd(), filePath),
							lineNumber: index + 1,
							content: extractDefinitionContent(lines, index),
							kind: 'enum'
						};
						definitions.push(def);
						addToTypeMap(typeNameMap, def);
					}
				});
			}
		} catch (error) {
			console.error(`Error processing directory ${currentDir}:`, error);
		}
	}

	searchDirectory(dir);

	// Find duplicates
	const duplicates = [];
	for (const [name, defs] of typeNameMap.entries()) {
		if (defs.length > 1) {
			duplicates.push({
				name,
				locations: defs.map((d) => ({
					filePath: d.filePath,
					lineNumber: d.lineNumber
				}))
			});
		}
	}

	return {
		definitions: definitions.sort((a, b) => a.name.localeCompare(b.name)),
		duplicates: duplicates.sort((a, b) => a.name.localeCompare(b.name))
	};
}

function addToTypeMap(map: Map<string, TypeDefinition[]>, def: TypeDefinition) {
	const existing = map.get(def.name) || [];
	existing.push(def);
	map.set(def.name, existing);
}

function extractDefinitionContent(lines: string[], startIndex: number): string {
	let content = lines[startIndex];
	let bracketCount = content.split('{').length - content.split('}').length;
	let currentIndex = startIndex + 1;

	// Handle single-line type definitions
	if (content.includes('=') && !content.includes('{')) {
		while (currentIndex < lines.length) {
			const line = lines[currentIndex].trim();
			content += ' ' + line;
			if (line.endsWith(';')) break;
			currentIndex++;
		}
		return content;
	}

	// Handle multi-line definitions
	while (bracketCount > 0 && currentIndex < lines.length) {
		const line = lines[currentIndex];
		content += '\n' + line;
		bracketCount += line.split('{').length - line.split('}').length;
		currentIndex++;
	}

	return content;
}

function generateReport(report: TypeReport): string {
	let output = '# Type Definition Report\n\n';

	output += `## Summary\n`;
	output += `- Total type definitions found: ${report.definitions.length}\n`;
	output += `- Duplicate types found: ${report.duplicates.length}\n\n`;

	output += '## Duplicate Types\n';
	report.duplicates.forEach((dup) => {
		output += `\n### ${dup.name}\n`;
		output += 'Found in:\n';
		dup.locations.forEach((loc) => {
			output += `- ${loc.filePath}:${loc.lineNumber}\n`;
		});
	});

	output += '\n## All Type Definitions\n';
	const groupedDefs = new Map<string, TypeDefinition[]>();

	report.definitions.forEach((def) => {
		const dir = dirname(def.filePath);
		const existing = groupedDefs.get(dir) || [];
		existing.push(def);
		groupedDefs.set(dir, existing);
	});

	Array.from(groupedDefs.entries())
		.sort(([a], [b]) => a.localeCompare(b))
		.forEach(([dir, defs]) => {
			output += `\n### ${dir}\n`;
			defs.forEach((def) => {
				output += `\n#### ${def.name} (${def.kind})\n`;
				output += `File: ${def.filePath}:${def.lineNumber}\n`;
				output += '```typescript\n';
				output += def.content;
				output += '\n```\n';
			});
		});

	return output;
}

// Run the script
const projectRoot = './src';
const report = findTypeDefinitions(projectRoot);
const reportContent = generateReport(report);
writeFileSync('type-report.md', reportContent);

console.log(`Found ${report.definitions.length} type definitions`);
console.log(`Found ${report.duplicates.length} duplicate types`);
