import * as vscode from 'vscode';
import * as os from 'os';

export interface StructInfo {
    name: string;
    totalSize: number;
    alignment: number;
}

export class StructAnalyzer {
    private architecture: string;
    private is64Bit: boolean;

    constructor() {
        this.architecture = os.arch();
        this.is64Bit = this.architecture.includes('64');
    }

    public findStructs(document: vscode.TextDocument): Map<string, StructInfo> {
        const structs = new Map<string, StructInfo>();
        const text = document.getText();

        // Regex pour capturer les définitions de structures
        const structRegex = /(?:typedef\s+)?struct\s+(?:(\w+)\s*)?\{([^}]+)\}\s*(?:(\w+)\s*)?;/g;

        let match;
        while ((match = structRegex.exec(text)) !== null) {
            const structName = match[1] || match[3]; // nom après struct ou après }
            const body = match[2];

            if (structName && body) {
                const structInfo = this.calculateStructSize(structName, body);
                if (structInfo) {
                    structs.set(structName, structInfo);
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
            const pointerSize = this.is64Bit ? 8 : 4;
            return { size: pointerSize, alignment: pointerSize };
        }

        // Nettoyer le type (enlever const, volatile, etc.)
        const cleanType = type.replace(/\b(const|volatile|static|extern|register)\b/g, '').trim();

        const typeInfo: { [key: string]: { x32: {size: number, alignment: number}, x64: {size: number, alignment: number} } } = {
            'char': { x32: {size: 1, alignment: 1}, x64: {size: 1, alignment: 1} },
            'signed char': { x32: {size: 1, alignment: 1}, x64: {size: 1, alignment: 1} },
            'unsigned char': { x32: {size: 1, alignment: 1}, x64: {size: 1, alignment: 1} },

            'short': { x32: {size: 2, alignment: 2}, x64: {size: 2, alignment: 2} },
            'short int': { x32: {size: 2, alignment: 2}, x64: {size: 2, alignment: 2} },
            'unsigned short': { x32: {size: 2, alignment: 2}, x64: {size: 2, alignment: 2} },
            'unsigned short int': { x32: {size: 2, alignment: 2}, x64: {size: 2, alignment: 2} },

            'int': { x32: {size: 4, alignment: 4}, x64: {size: 4, alignment: 4} },
            'signed': { x32: {size: 4, alignment: 4}, x64: {size: 4, alignment: 4} },
            'signed int': { x32: {size: 4, alignment: 4}, x64: {size: 4, alignment: 4} },
            'unsigned': { x32: {size: 4, alignment: 4}, x64: {size: 4, alignment: 4} },
            'unsigned int': { x32: {size: 4, alignment: 4}, x64: {size: 4, alignment: 4} },

            'long': { x32: {size: 4, alignment: 4}, x64: {size: 8, alignment: 8} },
            'long int': { x32: {size: 4, alignment: 4}, x64: {size: 8, alignment: 8} },
            'unsigned long': { x32: {size: 4, alignment: 4}, x64: {size: 8, alignment: 8} },
            'unsigned long int': { x32: {size: 4, alignment: 4}, x64: {size: 8, alignment: 8} },

            'long long': { x32: {size: 8, alignment: 8}, x64: {size: 8, alignment: 8} },
            'long long int': { x32: {size: 8, alignment: 8}, x64: {size: 8, alignment: 8} },
            'unsigned long long': { x32: {size: 8, alignment: 8}, x64: {size: 8, alignment: 8} },

            'float': { x32: {size: 4, alignment: 4}, x64: {size: 4, alignment: 4} },
            'double': { x32: {size: 8, alignment: 8}, x64: {size: 8, alignment: 8} },
            'long double': { x32: {size: 12, alignment: 4}, x64: {size: 16, alignment: 16} },

            'bool': { x32: {size: 1, alignment: 1}, x64: {size: 1, alignment: 1} },
            '_Bool': { x32: {size: 1, alignment: 1}, x64: {size: 1, alignment: 1} },

            // Types de taille fixe
            'int8_t': { x32: {size: 1, alignment: 1}, x64: {size: 1, alignment: 1} },
            'uint8_t': { x32: {size: 1, alignment: 1}, x64: {size: 1, alignment: 1} },
            'int16_t': { x32: {size: 2, alignment: 2}, x64: {size: 2, alignment: 2} },
            'uint16_t': { x32: {size: 2, alignment: 2}, x64: {size: 2, alignment: 2} },
            'int32_t': { x32: {size: 4, alignment: 4}, x64: {size: 4, alignment: 4} },
            'uint32_t': { x32: {size: 4, alignment: 4}, x64: {size: 4, alignment: 4} },
            'int64_t': { x32: {size: 8, alignment: 8}, x64: {size: 8, alignment: 8} },
            'uint64_t': { x32: {size: 8, alignment: 8}, x64: {size: 8, alignment: 8} },

            'size_t': { x32: {size: 4, alignment: 4}, x64: {size: 8, alignment: 8} },
            'ptrdiff_t': { x32: {size: 4, alignment: 4}, x64: {size: 8, alignment: 8} }
        };

        const info = typeInfo[cleanType.toLowerCase()];
        if (!info) {
            return null;
        }

        return (this.is64Bit ? info.x64 : info.x32);
    }

    private alignTo(offset: number, alignment: number): number {
        return Math.ceil(offset / alignment) * alignment;
    }
}
