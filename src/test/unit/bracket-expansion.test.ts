import * as vscode from 'vscode';
import * as assert from 'assert';
import { editorWithText, cursorToPos } from './utils';

suite('Bracket Expansion commands', () => {
    let editor: vscode.TextEditor;

    test('expandWithinBrackets selects content inside brackets', async () => {
        [editor] = await editorWithText(' ( content ) ');
        cursorToPos(editor, 0, 2); // Inside the space after (
        await vscode.commands.executeCommand('selection-utilities.expandWithinBrackets');
        await new Promise(resolve => setTimeout(resolve, 100));
        assert.strictEqual(editor.document.getText(editor.selection), ' content ');
    });

    test('expandAroundBrackets selects content including brackets', async () => {
        [editor] = await editorWithText(' ( content ) ');
        cursorToPos(editor, 0, 2); // Inside the space after (
        await vscode.commands.executeCommand('selection-utilities.expandAroundBrackets');
        await new Promise(resolve => setTimeout(resolve, 100));
        assert.strictEqual(editor.document.getText(editor.selection), '( content )');
    });

    test('expandWithinBrackets handles different bracket types', async () => {
        [editor] = await editorWithText(' [ content ] { other } ');

        // Square brackets
        cursorToPos(editor, 0, 3);
        await vscode.commands.executeCommand('selection-utilities.expandWithinBrackets');
        await new Promise(resolve => setTimeout(resolve, 100));
        assert.strictEqual(editor.document.getText(editor.selection), ' content ');

        // Curly brackets
        cursorToPos(editor, 0, 15);
        await vscode.commands.executeCommand('selection-utilities.expandWithinBrackets');
        await new Promise(resolve => setTimeout(resolve, 100));
        assert.strictEqual(editor.document.getText(editor.selection), ' other ');
    });

    test('expandWithinBrackets handles nested brackets and repeated calls', async () => {
        [editor] = await editorWithText(' ( outer [ inner ] outer ) ');
        cursorToPos(editor, 0, 12); // Inside 'inner'

        // First call: selects inner content
        await vscode.commands.executeCommand('selection-utilities.expandWithinBrackets');
        await new Promise(resolve => setTimeout(resolve, 100));
        assert.strictEqual(editor.document.getText(editor.selection), ' inner ');

        // Second call: expands to outer content
        await vscode.commands.executeCommand('selection-utilities.expandWithinBrackets');
        await new Promise(resolve => setTimeout(resolve, 100));
        assert.strictEqual(
            editor.document.getText(editor.selection),
            ' outer [ inner ] outer ',
        );
    });

    test('expandAroundBrackets handles nested brackets and repeated calls', async () => {
        [editor] = await editorWithText(' ( outer [ inner ] outer ) ');
        cursorToPos(editor, 0, 12); // Inside 'inner'

        // First call: selects [ inner ]
        await vscode.commands.executeCommand('selection-utilities.expandAroundBrackets');
        await new Promise(resolve => setTimeout(resolve, 100));
        assert.strictEqual(editor.document.getText(editor.selection), '[ inner ]');

        // Second call: expands to ( outer [ inner ] outer )
        await vscode.commands.executeCommand('selection-utilities.expandAroundBrackets');
        await new Promise(resolve => setTimeout(resolve, 100));
        assert.strictEqual(
            editor.document.getText(editor.selection),
            '( outer [ inner ] outer )',
        );
    });

    test('expandWithinBrackets handles multiple selections', async () => {
        [editor] = await editorWithText(' ( one ) [ two ] ');
        editor.selections = [
            new vscode.Selection(new vscode.Position(0, 3), new vscode.Position(0, 3)),
            new vscode.Selection(new vscode.Position(0, 11), new vscode.Position(0, 11)),
        ];

        await vscode.commands.executeCommand('selection-utilities.expandWithinBrackets');
        await new Promise(resolve => setTimeout(resolve, 100));

        assert.strictEqual(editor.selections.length, 2);
        assert.strictEqual(editor.document.getText(editor.selections[0]), ' one ');
        assert.strictEqual(editor.document.getText(editor.selections[1]), ' two ');
    });
});
