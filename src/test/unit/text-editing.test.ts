import * as vscode from 'vscode';
import * as assert from 'assert';
import { editorWithText, cursorToPos } from './utils';

suite('Editing commands', () => {
    let editor: vscode.TextEditor;

    test('can trim whitespace', async () => {
        [editor] = await editorWithText('aa   bb');
        cursorToPos(editor, 0, 0);
        await vscode.commands.executeCommand('selection-utilities.moveBy', {
            unit: 'word',
            value: 1,
            select: true,
            boundary: 'start',
        });
        await vscode.commands.executeCommand('selection-utilities.trimWhitespace');
        await new Promise(resolve => setTimeout(resolve, 100));
        assert.strictEqual(editor.document.getText(), 'aabb');
    });

    test('can align selections', async () => {
        const text = '\naaaaaaaa\n  bbbbbb\n    ccc\n';
        [editor] = await editorWithText(text);

        // Setup multiple cursors
        cursorToPos(editor, 1, 0);
        for (let i = 0; i < 3; i++) {
            await vscode.commands.executeCommand('editor.action.insertCursorBelow');
        }
        await new Promise(resolve => setTimeout(resolve, 100));

        await vscode.commands.executeCommand('selection-utilities.moveBy', {
            unit: 'word',
            value: 1,
            selectWhole: true,
            boundary: 'both',
        });
        await vscode.commands.executeCommand('selection-utilities.alignSelectionsLeft');
        await new Promise(resolve => setTimeout(resolve, 100));

        assert.strictEqual(
            editor.document.getText(),
            '\n    aaaaaaaa\n    bbbbbb\n    ccc\n    ',
        );

        // Align right
        await vscode.commands.executeCommand('selection-utilities.alignSelectionsRight');
        await new Promise(resolve => setTimeout(resolve, 100));

        assert.strictEqual(
            editor.document.getText(),
            '\n    aaaaaaaa\n      bbbbbb\n         ccc\n            ',
        );
    });

    test('can insert or delete around selections', async () => {
        [editor] = await editorWithText('foo bar');
        cursorToPos(editor, 0, 0);

        await vscode.commands.executeCommand('selection-utilities.moveBy', {
            unit: 'word',
            value: 1,
            select: true,
            boundary: 'end',
        });
        await vscode.commands.executeCommand('selection-utilities.insertAround', {
            before: '(',
            after: ')',
        });
        await new Promise(resolve => setTimeout(resolve, 100));
        assert.strictEqual(editor.document.getText(), '(foo) bar');

        cursorToPos(editor, 0, 1);
        await vscode.commands.executeCommand('selection-utilities.moveBy', {
            unit: 'word',
            value: 1,
            select: true,
            boundary: 'end',
        });
        await vscode.commands.executeCommand('selection-utilities.deleteAround');
        await new Promise(resolve => setTimeout(resolve, 100));
        assert.strictEqual(editor.document.getText(), 'foo bar');
    });
});
