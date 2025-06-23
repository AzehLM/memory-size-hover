import * as vscode from 'vscode';
import { MemorySizeHoverProvider } from './hoverProvider';

export function activate(context: vscode.ExtensionContext) {
    const provider = new MemorySizeHoverProvider();

    // Register ONLY ONE hover provider for all C/C++ files
    const disposable = vscode.languages.registerHoverProvider(
        [
            { scheme: 'file', language: 'c' },
            { scheme: 'file', language: 'cpp' },
            { scheme: 'file', language: 'h' },
            { scheme: 'file', language: 'hpp' }
        ],
        provider
    );

    context.subscriptions.push(disposable);
}

export function deactivate() {}
