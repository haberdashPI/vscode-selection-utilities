import * as vscode from 'vscode';
import * as assert from 'assert';
import { editorWithText, cursorToPos } from './utils';

suite('Number Motion', () => {
    let editor: vscode.TextEditor;

    setup(async () => {
        [editor] = await editorWithText('foo bar biz 123 biz bar foo');
    });

    test('Can move by start+end away from number', async () => {
        cursorToPos(editor, 0, 0);
        await vscode.commands.executeCommand('selection-utilities.moveBy', {
            unit: 'number',
            value: 1,
            selectWhole: true,
            boundary: 'both',
        });
        assert.equal(editor.document.getText(editor.selection), '123');
    });
});
