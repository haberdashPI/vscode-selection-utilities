import * as vscode from 'vscode';
import * as assert from 'assert';
import { editorWithText } from './utils';

suite('Change numbers', () => {
    let editor: vscode.TextEditor;

    async function setupCursors() {
        await vscode.commands.executeCommand('selection-utilities.cancelSelection');

        const selections = [];
        for (let i = 0; i < 4; i++) {
            const pos = new vscode.Position(i, 0);
            selections.push(new vscode.Selection(pos, new vscode.Position(i, 1)));
        }
        editor.selections = selections;
        await new Promise(resolve => setTimeout(resolve, 200));
    }

    setup(async () => {
        [editor] = await editorWithText('1\n1\n1\n1');
        await setupCursors();
    });

    test('Can increment numbers', async () => {
        await vscode.commands.executeCommand('selection-utilities.incrementNumber');
        const text = editor.document.getText();
        assert.strictEqual(text, '2\n2\n2\n2');
    });

    test('Can decrement numbers', async () => {
        await setupCursors();
        await vscode.commands.executeCommand('selection-utilities.decrementNumber');
        const text = editor.document.getText();
        assert.strictEqual(text, '0\n0\n0\n0');
    });

    test('Can increment numbers per selection', async () => {
        await setupCursors();
        await vscode.commands.executeCommand(
            'selection-utilities.incrementNumberPerSelection',
        );
        const text = editor.document.getText();
        assert.strictEqual(text, '1\n2\n3\n4');
    });

    test('Can decrement numbers per selection', async () => {
        await setupCursors();
        await vscode.commands.executeCommand(
            'selection-utilities.decrementNumberPerSelection',
        );
        const text = editor.document.getText();
        assert.strictEqual(text, '1\n0\n-1\n-2');
    });
});
