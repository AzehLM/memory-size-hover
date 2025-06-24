import * as vscode from 'vscode';
import { TypeInfoProvider } from './typeInfo';

export interface MemberInfo {
    type: string;
    name: string;
    offset: number;
    size: number;
    arraySize?: number;
    paddingAfter?: number;
}

export interface StructInfo {
    name: string;
    totalSize: number;
    alignment: number;
    members: MemberInfo[];
    hasVirtualTable?: boolean;
    baseClass?: string;
    type: 'struct' | 'class' | 'union';
}

export class StructAnalyzer {
    private typeProvider: TypeInfoProvider;
    private classVirtualMethods: Map<string, boolean> = new Map();

    constructor() {
        this.typeProvider = TypeInfoProvider.getInstance();
    }

    public findStructs(document: vscode.TextDocument): Map<string, StructInfo> {
        const structs = new Map<string, StructInfo>();
        const text = document.getText();

        // D'abord, détecter toutes les classes avec méthodes virtuelles
        this.detectVirtualClasses(text);

        // Regex pour capturer les définitions de structures, classes et unions
        const structRegex = /(?:typedef\s+)?(?:(struct|class|union)\s+)(?:(\w+)\s*)?(?::\s*(?:public|private|protected)\s+(\w+)\s*)?\{([^{}]*(?:\{[^{}]*\}[^{}]*)*)\}\s*(?:(\w+)\s*)?;/g;

        let match;
        while ((match = structRegex.exec(text)) !== null) {
            const keyword = match[1] || 'struct';
            const structName = match[2] || match[5];
            const baseClass = match[3];
            const body = match[4];

            if (structName && body) {
                const structInfo = this.calculateStructSize(structName, body, keyword as 'struct' | 'class' | 'union', baseClass);
                if (structInfo) {
                    structs.set(structName, structInfo);
                }
            }
        }

        return structs;
    }

    private detectVirtualClasses(text: string): void {
        // Regex pour détecter les classes avec méthodes virtuelles
        const classWithVirtualRegex = /class\s+(\w+)[^{]*\{([^}]+)\}/g;

        let match;
        while ((match = classWithVirtualRegex.exec(text)) !== null) {
            const className = match[1];
            const classBody = match[2];

            // Vérifier si la classe contient des méthodes virtuelles
            if (/\bvirtual\s+/.test(classBody)) {
                this.classVirtualMethods.set(className, true);
            }
        }
    }

    private calculateStructSize(name: string, body: string, type: 'struct' | 'class' | 'union', baseClass?: string): StructInfo | null {
        const members = this.parseMembers(body);
        if (members.length === 0 && !baseClass && !this.classVirtualMethods.get(name)) {
            return null;
        }

        let totalSize = 0;
        let maxAlignment = 1;
        const memberInfos: MemberInfo[] = [];
        let currentOffset = 0;

        // Si c'est une classe avec des méthodes virtuelles, ajouter le vptr
        const hasVirtualTable = type === 'class' && (this.classVirtualMethods.get(name) || false);
        if (hasVirtualTable) {
            const vptrSize = this.typeProvider.getPointerSize();
            memberInfos.push({
                type: '__vptr',
                name: '__vptr',
                offset: 0,
                size: vptrSize,
                paddingAfter: 0
            });
            currentOffset = vptrSize;
            totalSize = vptrSize;
            maxAlignment = vptrSize;
        }

        // Si c'est une classe dérivée, ajouter la taille de la classe de base
        if (baseClass) {
            // Pour simplifier, on assume que la classe de base a une taille standard
            // Dans une vraie implémentation, on devrait chercher la taille réelle
            const baseSize = this.estimateBaseClassSize(baseClass);
            if (baseSize > 0) {
                memberInfos.push({
                    type: `${baseClass} (base)`,
                    name: '__base',
                    offset: currentOffset,
                    size: baseSize,
                    paddingAfter: 0
                });
                currentOffset = baseSize;
                totalSize = baseSize;
                maxAlignment = Math.max(maxAlignment, 8); // Assumons alignement 8 pour les classes
            }
        }

        if (type === 'union') {
            // Pour les unions, tous les membres commencent à l'offset 0
            let maxSize = 0;
            for (const member of members) {
                const typeInfo = this.getTypeInfo(member.type);
                if (!typeInfo) continue;

                const memberSize = typeInfo.size * (member.arraySize || 1);
                maxSize = Math.max(maxSize, memberSize);
                maxAlignment = Math.max(maxAlignment, typeInfo.alignment);

                memberInfos.push({
                    type: member.type,
                    name: member.name,
                    offset: 0,
                    size: memberSize,
                    arraySize: member.arraySize,
                    paddingAfter: 0
                });
            }
            totalSize = this.alignTo(maxSize, maxAlignment);
        } else {
            // Pour les structs et classes, calculer avec padding
            for (let i = 0; i < members.length; i++) {
                const member = members[i];
                const typeInfo = this.getTypeInfo(member.type);
                if (!typeInfo) continue;

                const memberSize = typeInfo.size * (member.arraySize || 1);
                const alignment = typeInfo.alignment;

                maxAlignment = Math.max(maxAlignment, alignment);

                // Alignement du membre
                const alignedOffset = this.alignTo(currentOffset, alignment);
                const paddingBefore = alignedOffset - currentOffset;

                if (paddingBefore > 0 && i > 0) {
                    // Ajouter le padding au membre précédent
                    memberInfos[memberInfos.length - 1].paddingAfter = paddingBefore;
                }

                memberInfos.push({
                    type: member.type,
                    name: member.name,
                    offset: alignedOffset,
                    size: memberSize,
                    arraySize: member.arraySize,
                    paddingAfter: 0
                });

                currentOffset = alignedOffset + memberSize;
            }

            totalSize = currentOffset;
        }

        // Alignement final de la structure
        const finalSize = this.alignTo(totalSize, maxAlignment);
        if (finalSize > totalSize && memberInfos.length > 0) {
            memberInfos[memberInfos.length - 1].paddingAfter = finalSize - totalSize;
        }

        return {
            name,
            totalSize: finalSize,
            alignment: maxAlignment,
            members: memberInfos,
            hasVirtualTable,
            baseClass,
            type
        };
    }

    private estimateBaseClassSize(baseClassName: string): number {
        // Pour une implémentation simple, on estime la taille
        // Dans une vraie implémentation, on devrait chercher la définition de la classe
        if (this.classVirtualMethods.get(baseClassName)) {
            return this.typeProvider.getPointerSize(); // Au minimum un vptr
        }
        return 0; // Classe vide ou non trouvée
    }

    private parseMembers(body: string): Array<{type: string, name: string, arraySize?: number}> {
        const members: Array<{type: string, name: string, arraySize?: number}> = [];

        // Nettoyer le body
        let cleanBody = body
            .replace(/\/\*[\s\S]*?\*\//g, '') // Enlever les commentaires /* */
            .replace(/\/\/.*$/gm, ''); // Enlever les commentaires //

        // Ignorer les méthodes et ne garder que les membres de données
        const lines = cleanBody.split(/[;\n]/).map(line => line.trim()).filter(line => line.length > 0);

        for (const line of lines) {
            // Ignorer les méthodes (contiennent des parenthèses)
            if (line.includes('(') || line.includes(')')) {
                continue;
            }

            // Ignorer les mots-clés de visibilité
            if (/^(public|private|protected):$/.test(line)) {
                continue;
            }

            // Regex pour capturer type et nom avec potentiel tableau
            const memberRegex = /^\s*(.+?)\s+(\w+)(?:\[(\d+)\])?\s*$/;
            const match = memberRegex.exec(line);

            if (match) {
                const type = match[1].trim();
                const name = match[2];
                const arraySize = match[3] ? parseInt(match[3]) : undefined;

                // Ignorer les mots-clés qui ne sont pas des types
                if (['virtual', 'static', 'friend', 'typedef', 'using'].includes(type)) {
                    continue;
                }

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
