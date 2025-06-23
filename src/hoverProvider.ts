import * as vscode from 'vscode';
import * as os from 'os';

export class MemorySizeHoverProvider implements vscode.HoverProvider {
    private architecture: string;

    constructor() {
        this.architecture = os.arch();
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
        const memoryInfo = this.getMemoryInfo(word);

        if (!memoryInfo) {
            return undefined;
        }

        const config = vscode.workspace.getConfiguration('memorySizeHover');
        const showArchitecture = config.get<boolean>('showArchitecture', true);

        const hoverText = new vscode.MarkdownString();
        hoverText.supportHtml = true;

        // Style inspiré de Doxygen
        hoverText.appendMarkdown(`<div style="background-color: #f8f9fa; border-left: 4px solid #007acc; padding: 8px; margin: 4px 0;">`);
        hoverText.appendMarkdown(`Memory Size: <code style="color: #d73a49; background-color: #fff5f5; padding: 2px 4px; border-radius: 3px;">${memoryInfo.size} bytes</code>`);

        if (memoryInfo.description) {
            hoverText.appendMarkdown(`<br><small style="color: #586069;">${memoryInfo.description}</small>`);
        }

        if (showArchitecture) {
            const archIcon = this.architecture.includes('64') ? '🖥️' : '💻';
            hoverText.appendMarkdown(`<br><small style="color: #6f42c1;">${archIcon} Architecture: ${this.architecture}</small>`);
        }

        hoverText.appendMarkdown(`</div>`);


        return new vscode.Hover(hoverText, range);
    }

    private getMemoryInfo(type: string): { size: number; description?: string } | null {
        const is64Bit = this.architecture.includes('64');

        const typeInfo: { [key: string]: { x32: number; x64: number; desc?: string } } = {
            // Basic integer types
            'char': { x32: 1, x64: 1, desc: 'Character type, always 1 byte' },
            'signed char': { x32: 1, x64: 1, desc: 'Signed character (-128 to 127)' },
            'unsigned char': { x32: 1, x64: 1, desc: 'Unsigned character (0 to 255)' },

            // Short integers
            'short': { x32: 2, x64: 2, desc: 'Short integer, typically 16-bit' },
            'short int': { x32: 2, x64: 2, desc: 'Short integer, typically 16-bit' },
            'unsigned short': { x32: 2, x64: 2, desc: 'Unsigned short integer' },
            'unsigned short int': { x32: 2, x64: 2, desc: 'Unsigned short integer' },

            // Standard integers
            'int': { x32: 4, x64: 4, desc: 'Standard integer, typically 32-bit' },
            'signed': { x32: 4, x64: 4, desc: 'Signed integer (same as int)' },
            'signed int': { x32: 4, x64: 4, desc: 'Signed integer, typically 32-bit' },
            'unsigned': { x32: 4, x64: 4, desc: 'Unsigned integer' },
            'unsigned int': { x32: 4, x64: 4, desc: 'Unsigned integer, typically 32-bit' },

            // Long integers (platform dependent)
            'long': { x32: 4, x64: 8, desc: 'Long integer (platform dependent)' },
            'long int': { x32: 4, x64: 8, desc: 'Long integer (platform dependent)' },
            'signed long': { x32: 4, x64: 8, desc: 'Signed long integer' },
            'signed long int': { x32: 4, x64: 8, desc: 'Signed long integer' },
            'unsigned long': { x32: 4, x64: 8, desc: 'Unsigned long integer' },
            'unsigned long int': { x32: 4, x64: 8, desc: 'Unsigned long integer' },

            // Long long integers
            'long long': { x32: 8, x64: 8, desc: 'Long long integer, always 64-bit' },
            'long long int': { x32: 8, x64: 8, desc: 'Long long integer, always 64-bit' },
            'signed long long': { x32: 8, x64: 8, desc: 'Signed long long integer' },
            'signed long long int': { x32: 8, x64: 8, desc: 'Signed long long integer' },
            'unsigned long long': { x32: 8, x64: 8, desc: 'Unsigned long long integer' },
            'unsigned long long int': { x32: 8, x64: 8, desc: 'Unsigned long long integer' },

            // Floating point types
            'float': { x32: 4, x64: 4, desc: 'Single precision floating point (IEEE 754)' },
            'double': { x32: 8, x64: 8, desc: 'Double precision floating point (IEEE 754)' },
            'long double': { x32: 12, x64: 16, desc: 'Extended precision floating point' },

            // Boolean and wide character
            'bool': { x32: 1, x64: 1, desc: 'Boolean type (C++)' },
            '_Bool': { x32: 1, x64: 1, desc: 'Boolean type (C99)' },
            'wchar_t': { x32: 2, x64: 4, desc: 'Wide character type' },

            // Pointer types
            'void*': { x32: 4, x64: 8, desc: 'Generic pointer' },
            'char*': { x32: 4, x64: 8, desc: 'Pointer to char' },
            'int*': { x32: 4, x64: 8, desc: 'Pointer to int' },
            'float*': { x32: 4, x64: 8, desc: 'Pointer to float' },
            'double*': { x32: 4, x64: 8, desc: 'Pointer to double' },
            'void**': { x32: 4, x64: 8, desc: 'Pointer to pointer' },

            // System types
            'size_t': { x32: 4, x64: 8, desc: 'Size type for array indexing' },
            'ssize_t': { x32: 4, x64: 8, desc: 'Signed size type' },
            'ptrdiff_t': { x32: 4, x64: 8, desc: 'Pointer difference type' },
            'intptr_t': { x32: 4, x64: 8, desc: 'Integer type for storing pointers' },
            'uintptr_t': { x32: 4, x64: 8, desc: 'Unsigned integer type for storing pointers' },
            'off_t': { x32: 4, x64: 8, desc: 'File offset type' },
            'time_t': { x32: 4, x64: 8, desc: 'Time type' },

            // Fixed-width integer types (C99/C++11)
            'int8_t': { x32: 1, x64: 1, desc: 'Exactly 8-bit signed integer' },
            'uint8_t': { x32: 1, x64: 1, desc: 'Exactly 8-bit unsigned integer' },
            'int16_t': { x32: 2, x64: 2, desc: 'Exactly 16-bit signed integer' },
            'uint16_t': { x32: 2, x64: 2, desc: 'Exactly 16-bit unsigned integer' },
            'int32_t': { x32: 4, x64: 4, desc: 'Exactly 32-bit signed integer' },
            'uint32_t': { x32: 4, x64: 4, desc: 'Exactly 32-bit unsigned integer' },
            'int64_t': { x32: 8, x64: 8, desc: 'Exactly 64-bit signed integer' },
            'uint64_t': { x32: 8, x64: 8, desc: 'Exactly 64-bit unsigned integer' },

            // Fast and least types
            'int_fast8_t': { x32: 1, x64: 1, desc: 'Fastest type with at least 8 bits' },
            'uint_fast8_t': { x32: 1, x64: 1, desc: 'Fastest unsigned type with at least 8 bits' },
            'int_fast16_t': { x32: 4, x64: 8, desc: 'Fastest type with at least 16 bits' },
            'uint_fast16_t': { x32: 4, x64: 8, desc: 'Fastest unsigned type with at least 16 bits' },
            'int_fast32_t': { x32: 4, x64: 8, desc: 'Fastest type with at least 32 bits' },
            'uint_fast32_t': { x32: 4, x64: 8, desc: 'Fastest unsigned type with at least 32 bits' },
            'int_fast64_t': { x32: 8, x64: 8, desc: 'Fastest type with at least 64 bits' },
            'uint_fast64_t': { x32: 8, x64: 8, desc: 'Fastest unsigned type with at least 64 bits' },

            'int_least8_t': { x32: 1, x64: 1, desc: 'Smallest type with at least 8 bits' },
            'uint_least8_t': { x32: 1, x64: 1, desc: 'Smallest unsigned type with at least 8 bits' },
            'int_least16_t': { x32: 2, x64: 2, desc: 'Smallest type with at least 16 bits' },
            'uint_least16_t': { x32: 2, x64: 2, desc: 'Smallest unsigned type with at least 16 bits' },
            'int_least32_t': { x32: 4, x64: 4, desc: 'Smallest type with at least 32 bits' },
            'uint_least32_t': { x32: 4, x64: 4, desc: 'Smallest unsigned type with at least 32 bits' },
            'int_least64_t': { x32: 8, x64: 8, desc: 'Smallest type with at least 64 bits' },
            'uint_least64_t': { x32: 8, x64: 8, desc: 'Smallest unsigned type with at least 64 bits' },

            // Maximum width types
            'intmax_t': { x32: 8, x64: 8, desc: 'Maximum width signed integer' },
            'uintmax_t': { x32: 8, x64: 8, desc: 'Maximum width unsigned integer' }
        };

        const info = typeInfo[type.toLowerCase()];
        if (!info) {
            return null;
        }

        return {
            size: is64Bit ? info.x64 : info.x32,
            description: info.desc
        };
    }
}
