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
        const range = document.getWordRangeAtPosition(position);
        if (!range) {
            return undefined;
        }

        const word = document.getText(range);

        // Vérifier d'abord si c'est une structure définie par l'utilisateur
        const structInfo = this.getStructInfo(document, word);
        if (structInfo) {
            return this.createStructHover(structInfo, range);
        }

        // Sinon, vérifier les types de base
        const memoryInfo = this.getMemoryInfo(word);
        if (!memoryInfo) {
            return undefined;
        }

        return this.createTypeHover(memoryInfo, range);
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

        // Return hover with exact range - no extension needed
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

        // Return hover with exact range - no extension needed
        return new vscode.Hover(hoverText, range);
    }

    private getMemoryInfo(type: string): { size: number; description?: string } | null {
        // First check if it's a pointer type
        if (type.includes('*')) {
            const pointerSize = this.typeProvider.getPointerSize();
            // Extract the base type for better description
            const baseType = type.replace(/\s*\*+\s*/g, '').trim();
            const baseTypeInfo = this.typeProvider.getTypeInfo(baseType);
            const description = baseTypeInfo ? `Pointer to ${baseType}` : 'Pointer type';
            return { size: pointerSize, description };
        }

        // Check for basic types
        const typeInfo = this.typeProvider.getTypeInfo(type);
        if (!typeInfo) {
            return null;
        }

        const size = this.typeProvider.getMemorySize(type);
        if (size === null) {
            return null;
        }

        return {
            size,
            description: typeInfo.desc
        };
    }
}
