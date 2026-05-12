import * as vscode from 'vscode';
import * as assert from 'assert';
import { editorWithText } from './utils';

suite('Selection filtering', () => {
    let editor: vscode.TextEditor;

    async function setupCursors(editor: vscode.TextEditor) {
        await vscode.commands.executeCommand('selection-utilities.cancelSelection');

        // Setup initial cursors at the beginning of each line
        editor.selections = [
            new vscode.Selection(0, 0, 0, 0),
            new vscode.Selection(1, 12, 1, 12),
            new vscode.Selection(2, 12, 2, 12),
            new vscode.Selection(3, 12, 3, 12),
        ];

        await vscode.commands.executeCommand('selection-utilities.moveBy', {
            unit: 'word',
            value: 1,
            boundary: 'both',
            selectWhole: true,
        });
    }

    test('can filter by inclusion', async () => {
        [editor] = await editorWithText(`joe
            moe
            bill
            phill`);
        await setupCursors(editor);

        await vscode.commands.executeCommand('selection-utilities.includeBy', {
            text: 'oe',
        });
        await vscode.commands.executeCommand('deleteRight');

        const expected = `
            bill
            phill`;
        assert.equal(editor.document.getText().trim(), expected.trim());
    });

    test('can filter by exclusion', async () => {
        [editor] = await editorWithText(`joe
            moe
            bill
            phill`);
        await setupCursors(editor);

        await vscode.commands.executeCommand('selection-utilities.excludeBy', {
            text: 'oe',
        });
        await vscode.commands.executeCommand('deleteRight');

        const expected = `joe
            moe`;
        assert.equal(editor.document.getText().trim(), expected.trim());
    });

    test('can filter by regex inclusion', async () => {
        [editor] = await editorWithText(`joe
            moe
            bill
            phill`);
        await setupCursors(editor);

        await vscode.commands.executeCommand('selection-utilities.includeByRegex', {
            text: '^[jb]',
        });
        await vscode.commands.executeCommand('deleteRight');

        const expected = `
            moe
            
            phill`;
        assert.equal(editor.document.getText().trim(), expected.trim());
    });

    test('can filter by regex exclusion', async () => {
        [editor] = await editorWithText(`joe
            moe
            bill
            phill`);
        await setupCursors(editor);

        await vscode.commands.executeCommand('selection-utilities.excludeByRegex', {
            text: '^[jb]',
        });
        await vscode.commands.executeCommand('deleteRight');

        const expected = `joe
            
            bill`;
        assert.equal(editor.document.getText().trim(), expected.trim());
    });
});
