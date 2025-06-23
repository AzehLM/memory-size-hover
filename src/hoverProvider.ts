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

        // Vérifier d'abord si c'est une structure définie par l'utilisateur
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
            'struct', 'union', 'enum', 'void'
        ];

        // Créer un pattern pour matcher les types
        const typePattern = new RegExp(
            `\\b(?:(?:${typeKeywords.join('|')})\\s*)+(?:\\*+)?\\b`,
            'g'
        );

        let match;
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

        // Si aucun type composé n'est trouvé, essayer juste le mot sous le curseur
        const wordRange = document.getWordRangeAtPosition(position);
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

    private getStructInfo(document: vscode.TextDocument, structName: string): StructInfo | null {
        const documentUri = document.uri.toString();

        // Vérifier le cache
        if (!this.structCache.has(documentUri)) {
            this.structCache.set(documentUri, this.structAnalyzer.findStructs(document));
        }

        const structs = this.structCache.get(documentUri);
        return structs?.get(structName) || null;
    }

    private createStructHover(structInfo: StructInfo, range: vscode.Range): vscode.Hover {
        const config = vscode.workspace.getConfiguration('memorySizeHover');
        const showArchitecture = config.get<boolean>('showArchitecture', true);

        const hoverText = new vscode.MarkdownString();
        hoverText.supportHtml = true;
        hoverText.isTrusted = true;

        hoverText.appendMarkdown(`<div style="background-color: #f8f9fa; border-left: 4px solid #28a745; padding: 8px; margin: 4px 0;">`);
        hoverText.appendMarkdown(`Struct Size: <code style="color: #d73a49; background-color: #fff5f5; padding: 2px 4px; border-radius: 3px;">${structInfo.totalSize} bytes</code>`);
        hoverText.appendMarkdown(`<br><small style="color: #586069;">User-defined structure</small>`);

        if (showArchitecture) {
            const archIcon = this.typeProvider.is64BitArch() ? '🖥️' : '💻';
            hoverText.appendMarkdown(`<br><small style="color: #6f42c1;">${archIcon} Architecture: ${this.typeProvider.getArchitecture()}</small>`);
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
