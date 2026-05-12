import * as vscode from 'vscode';
import { debounce } from 'lodash';

/**
 * @section Selection Contexts
 * @sectionBody Contexts that report properties of selected text and clipboard text.
 * @command clipboardHasMultilineText
 *
 * A [`when` clause context](https://code.visualstudio.com/api/references/when-clause-contexts)
 * that is true when the clipboard contains multiple lines of text.
 */

interface SelectionContextState {
    clipboardHasMultilineText: boolean;
    editorHasMultilineSelection: boolean;
}

// we store these values as global so that unit tests can validate the state
// of the context variables; vscode provides no api to inspect these
declare global {
    var __selectionContextState__: SelectionContextState | undefined;
}

export const selectionContextState: SelectionContextState = {
    clipboardHasMultilineText: false,
    editorHasMultilineSelection: false,
};

globalThis.__selectionContextState__ = selectionContextState;

export async function checkClipboardForMultiline() {
    const text = await vscode.env.clipboard.readText();
    const hasMultiline = text.includes('\n') || text.includes('\r');
    selectionContextState.clipboardHasMultilineText = hasMultiline;
    vscode.commands.executeCommand(
        'setContext',
        'selection-utilities.clipboardHasMultilineText',
        hasMultiline,
    );
    return hasMultiline;
}

export function registerSelectionContext(context: vscode.ExtensionContext) {
    context.subscriptions.push(
        vscode.commands.registerCommand(
            'selection-utilities.checkClipboardForMultiline',
            () => checkClipboardForMultiline(),
        ),
    );

    const debouncedCheckMultiline = debounce(
        checkClipboardForMultiline, 500,
    );
    // poll clipboard at a relatively slow interval
    const configPolling = setInterval(async () => {
        debouncedCheckMultiline();
    }, 5000);
    context.subscriptions.push({
        dispose: () => clearInterval(configPolling),
    });

    /**
     * @command editorHasMultilineSelection
     *
     * A [`when` clause context](https://code.visualstudio.com/api/references/when-clause-contexts)
     * that is true when the selected text is composed of multiple lines.
     */

    vscode.window.onDidChangeTextEditorSelection(async (e) => {
        const isMultiline = e.selections.some(selection => !selection.isSingleLine);
        selectionContextState.editorHasMultilineSelection = isMultiline;
        vscode.commands.executeCommand(
            'setContext', 'selection-utilities.editorHasMultilineSelection', isMultiline,
        );
        // anytime the selection changes we also poll the clipboard
        // debouncing it to avoid excessive work
        debouncedCheckMultiline();
    });
}
