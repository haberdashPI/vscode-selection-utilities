import * as vscode from 'vscode';
import * as assert from 'assert';
import { editorWithText } from './utils';

declare global {
    var __selectionContextState__: {
        clipboardHasMultilineText: boolean;
        editorHasMultilineSelection: boolean;
    } | undefined;
}

suite('Selection Context', () => {
    let editor: vscode.TextEditor;

    setup(async () => {
        [editor] = await editorWithText('line1\nline2\nline3\nline4\n');
    });

    suite('editorHasMultilineSelection context', () => {
        test('false when cursor is at a single position', async () => {
            editor.selection = new vscode.Selection(
                new vscode.Position(0, 0),
                new vscode.Position(0, 0),
            );
            await new Promise(resolve => setTimeout(resolve, 50));
            assert.strictEqual(
                globalThis.__selectionContextState__?.editorHasMultilineSelection,
                false,
                'editorHasMultilineSelection should be false for collapsed cursor',
            );
        });

        test('false when selection is on a single line', async () => {
            editor.selection = new vscode.Selection(
                new vscode.Position(0, 0),
                new vscode.Position(0, 4),
            );
            await new Promise(resolve => setTimeout(resolve, 50));
            assert.strictEqual(
                globalThis.__selectionContextState__?.editorHasMultilineSelection,
                false,
                'editorHasMultilineSelection should be false for single-line selection',
            );
        });

        test('true when a selection spans multiple lines', async () => {
            editor.selection = new vscode.Selection(
                new vscode.Position(0, 0),
                new vscode.Position(1, 3),
            );
            await new Promise(resolve => setTimeout(resolve, 50));
            assert.strictEqual(
                globalThis.__selectionContextState__?.editorHasMultilineSelection,
                true,
                'editorHasMultilineSelection should be true for multiline selection',
            );
        });

        test('false when multiple selections are each single-line', async () => {
            editor.selections = [
                new vscode.Selection(
                    new vscode.Position(0, 0),
                    new vscode.Position(0, 3),
                ),
                new vscode.Selection(
                    new vscode.Position(1, 0),
                    new vscode.Position(1, 3),
                ),
            ];
            await new Promise(resolve => setTimeout(resolve, 50));
            assert.strictEqual(
                globalThis.__selectionContextState__?.editorHasMultilineSelection,
                false,
                'editorHasMultilineSelection should be false for single-line selections',
            );
        });

        test('true when at least one of multiple selections is multiline', async () => {
            editor.selections = [
                new vscode.Selection(
                    new vscode.Position(0, 0),
                    new vscode.Position(0, 3),
                ),
                new vscode.Selection(
                    new vscode.Position(1, 0),
                    new vscode.Position(2, 3),
                ),
            ];
            await new Promise(resolve => setTimeout(resolve, 50));
            assert.strictEqual(
                globalThis.__selectionContextState__?.editorHasMultilineSelection,
                true,
                'editorHasMultilineSelection should be true when one is multiline',
            );
        });

        test('updates back to false when returning to single line selection', async () => {
            editor.selection = new vscode.Selection(
                new vscode.Position(0, 0),
                new vscode.Position(2, 0),
            );
            await new Promise(resolve => setTimeout(resolve, 50));
            assert.strictEqual(
                globalThis.__selectionContextState__?.editorHasMultilineSelection,
                true,
            );

            editor.selection = new vscode.Selection(
                new vscode.Position(0, 0),
                new vscode.Position(0, 2),
            );
            await new Promise(resolve => setTimeout(resolve, 50));
            assert.strictEqual(
                globalThis.__selectionContextState__?.editorHasMultilineSelection,
                false,
                'editorHasMultilineSelection should revert to false',
            );
        });
    });

    suite('clipboardHasMultilineText context', () => {
        test('false when clipboard contains single-line text', async () => {
            await vscode.env.clipboard.writeText('single line text');
            await vscode.commands.executeCommand(
                'selection-utilities.checkClipboardForMultiline',
            );
            assert.strictEqual(
                globalThis.__selectionContextState__?.clipboardHasMultilineText,
                false,
                'clipboardHasMultilineText should be false for single-line text',
            );
        });

        test('true when clipboard contains LF newline', async () => {
            await vscode.env.clipboard.writeText('line1\nline2');
            await vscode.commands.executeCommand(
                'selection-utilities.checkClipboardForMultiline',
            );
            assert.strictEqual(
                globalThis.__selectionContextState__?.clipboardHasMultilineText,
                true,
                'clipboardHasMultilineText should be true when clipboard contains \\n',
            );
        });

        test('true when clipboard contains CR newline', async () => {
            await vscode.env.clipboard.writeText('line1\rline2');
            await vscode.commands.executeCommand(
                'selection-utilities.checkClipboardForMultiline',
            );
            assert.strictEqual(
                globalThis.__selectionContextState__?.clipboardHasMultilineText,
                true,
                'clipboardHasMultilineText should be true when clipboard contains \\r',
            );
        });

        test('true when clipboard contains CRLF newline', async () => {
            await vscode.env.clipboard.writeText('line1\r\nline2');
            await vscode.commands.executeCommand(
                'selection-utilities.checkClipboardForMultiline',
            );
            assert.strictEqual(
                globalThis.__selectionContextState__?.clipboardHasMultilineText,
                true,
                'clipboardHasMultilineText should be true when clipboard contains \\r\\n',
            );
        });

        test('updates back to false when clipboard changes to single-line', async () => {
            await vscode.env.clipboard.writeText('first\nsecond');
            await vscode.commands.executeCommand(
                'selection-utilities.checkClipboardForMultiline',
            );
            assert.strictEqual(
                globalThis.__selectionContextState__?.clipboardHasMultilineText,
                true,
            );

            await vscode.env.clipboard.writeText('now single line');
            await vscode.commands.executeCommand(
                'selection-utilities.checkClipboardForMultiline',
            );
            assert.strictEqual(
                globalThis.__selectionContextState__?.clipboardHasMultilineText,
                false,
                'clipboardHasMultilineText should revert to false',
            );
        });

        test('automatically updates via debounce after selection change', async () => {
            await vscode.env.clipboard.writeText('multiline\ntext');
            editor.selection = new vscode.Selection(
                new vscode.Position(0, 0),
                new vscode.Position(0, 1),
            );
            // Wait for debounce delay (500ms) + buffer
            await new Promise(resolve => setTimeout(resolve, 700));
            assert.strictEqual(
                globalThis.__selectionContextState__?.clipboardHasMultilineText,
                true,
                'clipboardHasMultilineText should update automatically via debounce',
            );
        });
    });
});
