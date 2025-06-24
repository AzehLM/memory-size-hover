import * as vscode from 'vscode';
import { StructAnalyzer, StructInfo } from './structAnalyzer';
import { TypeInfoProvider } from './typeInfo';

export class MemorySizeHoverProvider implements vscode.HoverProvider {
    private typeProvider: TypeInfoProvider;
    private structAnalyzer: StructAnalyzer;
    private structCache: Map<string, Map<string, StructInfo>> = new Map();

    constructor() {
        this.typeProvider = TypeInfoProvider.getInstance();
        this.structAnalyzer = new StructAnalyzer();

        // Invalider le cache quand un document change
        vscode.workspace.onDidChangeTextDocument((e) => {
            const uri = e.document.uri.toString();
            if (this.structCache.has(uri)) {
                this.structCache.delete(uri);
            }
        });
    }

    provideHover(
        document: vscode.TextDocument,
        position: vscode.Position,
        token: vscode.CancellationToken
    ): vscode.ProviderResult<vscode.Hover> {
        // Obtenir le type complet à la position du curseur
        const typeInfo = this.getTypeAtPosition(document, position);
        if (!typeInfo) {
            return undefined;
        }

        // Vérifier d'abord si c'est une structure/classe définie par l'utilisateur
        const structInfo = this.getStructInfo(document, typeInfo.text);
        if (structInfo) {
            return this.createStructHover(structInfo, typeInfo.range);
        }

        // Sinon, vérifier les types de base
        const memoryInfo = this.getMemoryInfo(typeInfo.text);
        if (!memoryInfo) {
            return undefined;
        }

        return this.createTypeHover(memoryInfo, typeInfo.range);
    }

    private getTypeAtPosition(document: vscode.TextDocument, position: vscode.Position): { text: string; range: vscode.Range } | null {
        const line = document.lineAt(position.line);
        const lineText = line.text;

        // Mots-clés de types C/C++
        const typeKeywords = [
            'signed', 'unsigned', 'const', 'volatile', 'static', 'extern', 'register',
            'short', 'long', 'char', 'int', 'float', 'double',
            'bool', '_Bool', 'wchar_t',
            'int8_t', 'int16_t', 'int32_t', 'int64_t',
            'uint8_t', 'uint16_t', 'uint32_t', 'uint64_t',
            'size_t', 'ptrdiff_t', 'intptr_t', 'uintptr_t',
            'int_fast8_t', 'int_fast16_t', 'int_fast32_t', 'int_fast64_t',
            'uint_fast8_t', 'uint_fast16_t', 'uint_fast32_t', 'uint_fast64_t',
            'int_least8_t', 'int_least16_t', 'int_least32_t', 'int_least64_t',
            'uint_least8_t', 'uint_least16_t', 'uint_least32_t', 'uint_least64_t',
            'intmax_t', 'uintmax_t',
            'struct', 'union', 'enum', 'void', 'class'
        ];

        // 1. D'abord, essayer de détecter "struct StructName", "class ClassName" ou "union UnionName"
        const structPattern = /\b(?:struct|union|class)\s+(\w+)(?:\s*\*+)?\b/g;
        let match;
        while ((match = structPattern.exec(lineText)) !== null) {
            const startPos = match.index;
            const endPos = match.index + match[0].length;

            if (position.character >= startPos && position.character <= endPos) {
                // Extraire juste le nom de la structure/classe
                const structName = match[1];
                const structNameStart = match.index + match[0].indexOf(structName);
                const structNameEnd = structNameStart + structName.length;

                // Vérifier si le curseur est sur le nom
                if (position.character >= structNameStart && position.character <= structNameEnd) {
                    return {
                        text: structName,
                        range: new vscode.Range(
                            position.line,
                            structNameStart,
                            position.line,
                            structNameEnd
                        )
                    };
                }

                // Si le curseur est sur "struct", "class" ou "union", retourner le type complet
                return {
                    text: match[0].trim().replace(/\s+/g, ' '),
                    range: new vscode.Range(
                        position.line,
                        startPos,
                        position.line,
                        endPos
                    )
                };
            }
        }

        // 2. Essayer de détecter un nom de type défini par l'utilisateur (typedef struct/class)
        const wordRange = document.getWordRangeAtPosition(position);
        if (wordRange) {
            const word = document.getText(wordRange);

            // Vérifier si c'est un nom de struct/class connu
            const structs = this.getStructsFromDocument(document);
            if (structs.has(word)) {
                return {
                    text: word,
                    range: wordRange
                };
            }
        }

        // 3. Créer un pattern pour matcher les types de base avec modificateurs
        const typePattern = new RegExp(
            `\\b(?:(?:${typeKeywords.join('|')})\\s*)+(?:\\*+)?\\b`,
            'g'
        );

        // Réinitialiser lastIndex pour la nouvelle recherche
        typePattern.lastIndex = 0;

        while ((match = typePattern.exec(lineText)) !== null) {
            const startPos = match.index;
            const endPos = match.index + match[0].length;

            // Vérifier si la position du curseur est dans ce match
            if (position.character >= startPos && position.character <= endPos) {
                // Nettoyer le type trouvé
                let typeText = match[0].trim();

                // Gérer les cas spéciaux où on pourrait avoir des espaces multiples
                typeText = typeText.replace(/\s+/g, ' ');

                return {
                    text: typeText,
                    range: new vscode.Range(
                        position.line,
                        startPos,
                        position.line,
                        endPos
                    )
                };
            }
        }

        // 4. Si aucun type composé n'est trouvé, essayer juste le mot sous le curseur
        if (wordRange) {
            const word = document.getText(wordRange);
            // Vérifier si c'est un mot-clé de type connu
            if (typeKeywords.includes(word) || word.includes('*')) {
                return {
                    text: word,
                    range: wordRange
                };
            }
        }

        return null;
    }

    private getStructsFromDocument(document: vscode.TextDocument): Map<string, StructInfo> {
        const documentUri = document.uri.toString();

        // Vérifier le cache
        if (!this.structCache.has(documentUri)) {
            this.structCache.set(documentUri, this.structAnalyzer.findStructs(document));
        }

        return this.structCache.get(documentUri) || new Map();
    }

    private getStructInfo(document: vscode.TextDocument, typeName: string): StructInfo | null {
        const structs = this.getStructsFromDocument(document);

        // Essayer d'abord le nom exact
        let structInfo = structs.get(typeName);
        if (structInfo) {
            return structInfo;
        }

        // Si le typeName contient "struct ", extraire juste le nom
        if (typeName.startsWith('struct ')) {
            const structName = typeName.substring(7).trim();
            structInfo = structs.get(structName);
            if (structInfo) {
                return structInfo;
            }
        }

        // Si le typeName contient "class ", extraire juste le nom
        if (typeName.startsWith('class ')) {
            const className = typeName.substring(6).trim();
            structInfo = structs.get(className);
            if (structInfo) {
                return structInfo;
            }
        }

        // Si le typeName contient "union ", extraire juste le nom
        if (typeName.startsWith('union ')) {
            const unionName = typeName.substring(6).trim();
            structInfo = structs.get(unionName);
            if (structInfo) {
                return structInfo;
            }
        }

        return null;
    }

    private createMemoryLayout(structInfo: StructInfo): string {
        if (structInfo.type === 'union') {
            return this.createUnionLayout(structInfo);
        }

        let layout = '';
        let currentOffset = 0;

        for (const member of structInfo.members) {
            // Ajouter une ligne pour chaque membre
            const memberLine = this.createMemberLine(member, currentOffset);
            layout += memberLine + '\n';

            currentOffset = member.offset + member.size;

            // Ajouter le padding si nécessaire
            if (member.paddingAfter && member.paddingAfter > 0) {
                const paddingLine = this.createPaddingLine(member.paddingAfter, currentOffset);
                layout += paddingLine + '\n';
                currentOffset += member.paddingAfter;
            }
        }

        return layout;
    }

    private createUnionLayout(structInfo: StructInfo): string {
        let layout = '';

        for (let i = 0; i < structInfo.members.length; i++) {
            const member = structInfo.members[i];
            const prefix = i === 0 ? '┌─' : '├─';
            layout += `${prefix} ${member.name} (${member.type}): ${member.size} bytes\n`;
        }

        layout += `└─ Total: ${structInfo.totalSize} bytes`;
        return layout;
    }

    private createMemberLine(member: any, offset: number): string {
        const offsetStr = offset.toString().padStart(2, '0');
        const sizeStr = `${member.size} byte${member.size > 1 ? 's' : ''}`;

        if (member.name === '__vptr') {
            return `${offsetStr}: [vptr      ] ${sizeStr} (virtual table pointer)`;
        } else if (member.name === '__base') {
            return `${offsetStr}: [base class] ${sizeStr} (${member.type})`;
        } else {
            const displayName = member.name.padEnd(10, ' ').substring(0, 10);
            return `${offsetStr}: [${displayName}] ${sizeStr} (${member.type})`;
        }
    }

    private createPaddingLine(paddingSize: number, offset: number): string {
        const offsetStr = offset.toString().padStart(2, '0');
        const paddingStr = '░'.repeat(Math.min(paddingSize * 2, 20));
        return `${offsetStr}: ${paddingStr} ${paddingSize} byte${paddingSize > 1 ? 's' : ''} padding`;
    }

    private createStructHover(structInfo: StructInfo, range: vscode.Range): vscode.Hover {
        const config = vscode.workspace.getConfiguration('memorySizeHover');
        const showArchitecture = config.get<boolean>('showArchitecture', true);

        const hoverText = new vscode.MarkdownString();
        hoverText.supportHtml = true;
        hoverText.isTrusted = true;

        // Header avec type et taille
        const typeLabel = structInfo.type.charAt(0).toUpperCase() + structInfo.type.slice(1);
        const color = structInfo.type === 'class' ? '#9B59B6' :
                      structInfo.type === 'union' ? '#E74C3C' : '#28a745';

        hoverText.appendMarkdown(`<div style="background-color: #f8f9fa; border-left: 4px solid ${color}; padding: 8px; margin: 4px 0;">`);
        hoverText.appendMarkdown(`<strong>${typeLabel} ${structInfo.name}</strong><br>`);
        hoverText.appendMarkdown(`Total Size: <code style="color: #d73a49; background-color: #fff5f5; padding: 2px 4px; border-radius: 3px;">${structInfo.totalSize} bytes</code>`);

        if (structInfo.baseClass) {
            hoverText.appendMarkdown(`<br>Inherits from: <code>${structInfo.baseClass}</code>`);
        }

        if (structInfo.hasVirtualTable) {
            hoverText.appendMarkdown(`<br><small style="color: #6f42c1;">✓ Has virtual table</small>`);
        }

        hoverText.appendMarkdown(`<br><small style="color: #586069;">Alignment: ${structInfo.alignment} bytes</small>`);

        // Memory layout
        if (structInfo.members.length > 0) {
            hoverText.appendMarkdown(`<br><br><strong>Memory Layout:</strong>`);
            hoverText.appendCodeblock(this.createMemoryLayout(structInfo), 'text');
        }

        // Architecture info
        if (showArchitecture) {
            const archIcon = this.typeProvider.is64BitArch() ? '🖥️' : '💻';
            hoverText.appendMarkdown(`<small style="color: #6f42c1;">${archIcon} Architecture: ${this.typeProvider.getArchitecture()}</small>`);
        }

        hoverText.appendMarkdown(`</div>`);

        return new vscode.Hover(hoverText, range);
    }

    private createTypeHover(memoryInfo: { size: number; description?: string }, range: vscode.Range): vscode.Hover {
        const config = vscode.workspace.getConfiguration('memorySizeHover');
        const showArchitecture = config.get<boolean>('showArchitecture', true);

        const hoverText = new vscode.MarkdownString();
        hoverText.supportHtml = true;
        hoverText.isTrusted = true;

        hoverText.appendMarkdown(`<div style="background-color: #f8f9fa; border-left: 4px solid #007acc; padding: 8px; margin: 4px 0;">`);
        hoverText.appendMarkdown(`Memory Size: <code style="color: #d73a49; background-color: #fff5f5; padding: 2px 4px; border-radius: 3px;">${memoryInfo.size} bytes</code>`);

        if (memoryInfo.description) {
            hoverText.appendMarkdown(`<br><small style="color: #586069;">${memoryInfo.description}</small>`);
        }

        if (showArchitecture) {
            const archIcon = this.typeProvider.is64BitArch() ? '🖥️' : '💻';
            hoverText.appendMarkdown(`<br><small style="color: #6f42c1;">${archIcon} Architecture: ${this.typeProvider.getArchitecture()}</small>`);
        }

        hoverText.appendMarkdown(`</div>`);

        return new vscode.Hover(hoverText, range);
    }

    private getMemoryInfo(type: string): { size: number; description?: string } | null {
        // Nettoyer et normaliser le type
        let cleanType = type.trim();

        // First check if it's a pointer type
        if (cleanType.includes('*')) {
            const pointerSize = this.typeProvider.getPointerSize();
            // Extract the base type for better description
            const baseType = cleanType.replace(/\s*\*+\s*/g, '').trim();
            const baseTypeInfo = this.typeProvider.getTypeInfo(baseType);
            const description = baseTypeInfo ? `Pointer to ${baseType}` : 'Pointer type';
            return { size: pointerSize, description };
        }

        // Check for basic types
        const typeInfo = this.typeProvider.getTypeInfo(cleanType);
        if (!typeInfo) {
            return null;
        }

        const size = this.typeProvider.getMemorySize(cleanType);
        if (size === null) {
            return null;
        }

        return {
            size,
            description: typeInfo.desc
        };
    }
}
