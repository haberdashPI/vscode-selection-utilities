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

    test('trimWhitespace trims inside selection and does not trim outside', async () => {
        [editor] = await editorWithText('foo   bar   baz');
        // Word selected without surrounding whitespace: nothing should be trimmed
        editor.selection = new vscode.Selection(0, 6, 0, 9);
        await vscode.commands.executeCommand('selection-utilities.trimWhitespace');
        await new Promise(resolve => setTimeout(resolve, 100));
        assert.strictEqual(editor.document.getText(), 'foo   bar   baz');

        // Selection including surrounding whitespace: trims whitespace inside selection
        editor.selection = new vscode.Selection(0, 3, 0, 12);
        await vscode.commands.executeCommand('selection-utilities.trimWhitespace');
        await new Promise(resolve => setTimeout(resolve, 100));
        assert.strictEqual(editor.document.getText(), 'foobarbaz');
    });

    test('trimWhitespace does not trim when cursor is empty', async () => {
        [editor] = await editorWithText('foo   bar   baz');
        cursorToPos(editor, 0, 7);
        await vscode.commands.executeCommand('selection-utilities.trimWhitespace');
        await new Promise(resolve => setTimeout(resolve, 100));
        assert.strictEqual(editor.document.getText(), 'foo   bar   baz');
    });

    test('can trim whitespace around when word is selected', async () => {
        [editor] = await editorWithText('foo   bar   baz');
        editor.selection = new vscode.Selection(0, 6, 0, 9);
        await vscode.commands.executeCommand('selection-utilities.trimWhitespaceAround');
        await new Promise(resolve => setTimeout(resolve, 100));
        assert.strictEqual(editor.document.getText(), 'foobarbaz');
    });

    test('can trim whitespace around when cursor is in word', async () => {
        [editor] = await editorWithText('foo   bar   baz');
        cursorToPos(editor, 0, 7);
        await vscode.commands.executeCommand('selection-utilities.trimWhitespaceAround');
        await new Promise(resolve => setTimeout(resolve, 100));
        assert.strictEqual(editor.document.getText(), 'foobarbaz');
    });

    test('can trim whitespace around a block selection', async () => {
        [editor] = await editorWithText('foo   bar + baz   qux');
        editor.selection = new vscode.Selection(0, 6, 0, 15);
        await vscode.commands.executeCommand('selection-utilities.trimWhitespaceAround');
        await new Promise(resolve => setTimeout(resolve, 100));
        assert.strictEqual(editor.document.getText(), 'foobar + bazqux');
    });

    test('can trim whitespace around when cursor is in whitespace', async () => {
        [editor] = await editorWithText('foo   bar');
        cursorToPos(editor, 0, 4);
        await vscode.commands.executeCommand('selection-utilities.trimWhitespaceAround');
        await new Promise(resolve => setTimeout(resolve, 100));
        assert.strictEqual(editor.document.getText(), 'foobar');
    });

    test('can trim whitespace around with multiple cursors in words', async () => {
        [editor] = await editorWithText('foo   bar   baz');
        editor.selections = [
            new vscode.Selection(0, 1, 0, 1),
            new vscode.Selection(0, 13, 0, 13),
        ];
        await vscode.commands.executeCommand('selection-utilities.trimWhitespaceAround');
        await new Promise(resolve => setTimeout(resolve, 100));
        assert.strictEqual(editor.document.getText(), 'foobarbaz');
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
