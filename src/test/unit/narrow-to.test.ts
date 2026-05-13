import * as vscode from 'vscode';
import * as assert from 'assert';
import { editorWithText } from './utils';

suite('Narrow To', () => {
    let editor: vscode.TextEditor;

    async function narrowTo(args: { unit: string }, expected: string) {
        await vscode.commands.executeCommand('selection-utilities.narrowTo', args);
        assert.strictEqual(editor.document.getText(editor.selection), expected);
    }

    test('Can narrow to word', async () => {
        [editor] = await editorWithText('foo bar biz baz');
        editor.selection = new vscode.Selection(0, 0, 0, 7); // "foo bar"
        await narrowTo({ unit: 'word' }, 'foo bar');
    });

    test('Can narrow to word with extra spaces', async () => {
        [editor] = await editorWithText('foo bar biz baz');
        editor.selection = new vscode.Selection(0, 0, 0, 8); // "foo bar "
        await narrowTo({ unit: 'word' }, 'foo bar');
    });

    test('Can narrow to word starting from middle of word', async () => {
        [editor] = await editorWithText('foo bar biz baz');
        editor.selection = new vscode.Selection(0, 1, 0, 7); // "oo bar"
        await narrowTo({ unit: 'word' }, 'bar');
    });

    test('Can narrow to subword', async () => {
        [editor] = await editorWithText('fooBarBiz');
        editor.selection = new vscode.Selection(0, 0, 0, 6); // "fooBar"
        await narrowTo({ unit: 'subword' }, 'fooBar');
    });

    test('Can narrow to subword starting from middle', async () => {
        [editor] = await editorWithText('fooBarBiz');
        editor.selection = new vscode.Selection(0, 1, 0, 6); // "ooBar"
        await narrowTo({ unit: 'subword' }, 'Bar');
    });

    test('Does nothing if no unit is contained', async () => {
        [editor] = await editorWithText('foo bar');
        editor.selection = new vscode.Selection(0, 1, 0, 2); // "o" in "foo"
        await narrowTo({ unit: 'word' }, 'o');
    });

    test('Can narrow to multiple units', async () => {
        [editor] = await editorWithText('foo bar biz baz');
        editor.selection = new vscode.Selection(0, 0, 0, 11); // "foo bar biz"
        await narrowTo({ unit: 'word' }, 'foo bar biz');
    });

    test('Narrows both sides', async () => {
        [editor] = await editorWithText('  foo bar  ');
        editor.selection = new vscode.Selection(0, 0, 0, 11); // "  foo bar  "
        await narrowTo({ unit: 'word' }, 'foo bar');
    });

    test('Works with backwards selection', async () => {
        [editor] = await editorWithText('  foo bar  ');
        editor.selection = new vscode.Selection(0, 11, 0, 0); // "  foo bar  " reversed
        await vscode.commands.executeCommand(
            'selection-utilities.narrowTo',
            { unit: 'word' },
        );
        assert.strictEqual(editor.document.getText(editor.selection), 'foo bar');
        assert.strictEqual(editor.selection.anchor.character, 9);
        assert.strictEqual(editor.selection.active.character, 2);
    });

    test('Works with multiple selections', async () => {
        [editor] = await editorWithText('foo bar\nbiz baz');
        editor.selections = [
            new vscode.Selection(0, 0, 0, 7),
            new vscode.Selection(1, 0, 1, 7),
        ];
        await vscode.commands.executeCommand(
            'selection-utilities.narrowTo',
            { unit: 'word' },
        );
        assert.strictEqual(editor.selections.length, 2);
        assert.strictEqual(editor.document.getText(editor.selections[0]), 'foo bar');
        assert.strictEqual(editor.document.getText(editor.selections[1]), 'biz baz');
    });
});
