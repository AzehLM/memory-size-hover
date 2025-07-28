import * as vscode from 'vscode';
import { TypeInfoProvider } from './typeInfo';

export interface StructInfo {
    name: string;
    totalSize: number;
    alignment: number;
}

export class StructAnalyzer {
    private typeProvider: TypeInfoProvider;

    constructor() {
        this.typeProvider = TypeInfoProvider.getInstance();
    }

    public findStructs(document: vscode.TextDocument): Map<string, StructInfo> {
        const structs = new Map<string, StructInfo>();
        const text = document.getText();

        // Regex pour capturer les définitions de structures
        const structRegex = /(?:typedef\s+)?struct\s+(?:(\w+)\s*)?\{([^}]+)\}\s*(?:(\w+)\s*)?;/g;

        let match;
        while ((match = structRegex.exec(text)) !== null) {
            const structName = match[1] || match[3];
            const body = match[2];

            if (structName && body) {
                const structInfo = this.calculateStructSize(structName, body);
                if (structInfo) {
                    structs.set(structName, structInfo);
                }
            }
        }

        // Regex pour capturer les définitions de classes C++
        const classRegex = /class\s+(\w+)(?:\s*\:\s*(?:(?:public|private|protected)\s+\w+(?:\s*,\s*(?:public|private|protected)\s+\w+)*))?\s*\{([^}]+)\}\s*;/g;

        while ((match = classRegex.exec(text)) !== null) {
            const className = match[1];
            const body = match[match.length - 1];

            if (className && body) {
                const classInfo = this.calculateStructSize(className, body);
                if (classInfo) {
                    structs.set(className, classInfo);
                }
            }
        }

        return structs;
    }

    private calculateStructSize(name: string, body: string): StructInfo | null {
        const members = this.parseMembers(body);
        if (members.length === 0) {
            return null;
        }

        let totalSize = 0;
        let maxAlignment = 1;

        for (const member of members) {
            const typeInfo = this.getTypeInfo(member.type);
            if (!typeInfo) {
                continue; // Ignore les types non reconnus
            }

            const memberSize = typeInfo.size * (member.arraySize || 1);
            const alignment = typeInfo.alignment;

            maxAlignment = Math.max(maxAlignment, alignment);

            // Alignement du membre
            totalSize = this.alignTo(totalSize, alignment);
            totalSize += memberSize;
        }

        // Alignement final de la structure
        totalSize = this.alignTo(totalSize, maxAlignment);

        return {
            name,
            totalSize,
            alignment: maxAlignment
        };
    }

    private parseMembers(body: string): Array<{type: string, name: string, arraySize?: number}> {
        const members: Array<{type: string, name: string, arraySize?: number}> = [];

        // Nettoyer et diviser en lignes
        const lines = body.split(/[;\n]/).map(line => line.trim()).filter(line => line.length > 0);

        for (const line of lines) {
            // Ignorer les commentaires
            if (line.startsWith('//') || line.startsWith('/*')) {
                continue;
            }

            // Ignorer les access specifiers (public:, private:, protected:)
            if (line.match(/^\s*(public|private|protected)\s*:\s*$/)) {
                continue;
            }

            // Ignorer les méthodes/fonctions (contiennent des parenthèses)
            if (line.includes('(') && line.includes(')')) {
                continue;
            }

            // Regex pour capturer type et nom avec potentiel tableau
            const memberRegex = /^\s*(.+?)\s+(\w+)(?:\[(\d+)\])?\s*$/;
            const match = memberRegex.exec(line);

            if (match) {
                const type = match[1].trim();
                const name = match[2];
                const arraySize = match[3] ? parseInt(match[3]) : undefined;

                members.push({ type, name, arraySize });
            }
        }

        return members;
    }

    private getTypeInfo(type: string): {size: number, alignment: number} | null {
        // Gérer les pointeurs
        if (type.includes('*')) {
            const pointerSize = this.typeProvider.getPointerSize();
            return { size: pointerSize, alignment: pointerSize };
        }

        // Nettoyer le type (enlever const, volatile, etc.)
        const cleanType = type.replace(/\b(const|volatile|static|extern|register)\b/g, '').trim();

        // Normaliser les espaces multiples
        const normalizedType = cleanType.replace(/\s+/g, ' ');

        const size = this.typeProvider.getMemorySize(normalizedType);
        const alignment = this.typeProvider.getAlignment(normalizedType);

        if (size === null || alignment === null) {
            return null;
        }

        return { size, alignment };
    }

    private alignTo(offset: number, alignment: number): number {
        return Math.ceil(offset / alignment) * alignment;
    }
}
