import * as vscode from 'vscode';
import * as assert from 'assert';
import { editorWithText } from './utils';

suite('Selection splitting', () => {
    let editor: vscode.TextEditor;
    const startText = `joe, boe, woe
            moe,b foe,c doe,d
            bill
            phill
        `;

    setup(async () => {
        [editor] = await editorWithText(startText);
        await vscode.commands.executeCommand('editor.action.selectAll');
    });

    test('can split by string', async () => {
        await vscode.commands.executeCommand('selection-utilities.splitBy', {
            text: ',',
        });
        await new Promise(resolve => setTimeout(resolve, 100));
        await vscode.commands.executeCommand('cursorRight');
        await vscode.commands.executeCommand('type', { text: '+' });

        const expected = 'joe+, boe+, woe\n            moe+,b foe+,c doe+,d\n' +
            '            bill\n            phill\n        +';
        assert.strictEqual(editor.document.getText(), expected);
    });

    test('can split by newline', async () => {
        await vscode.commands.executeCommand('selection-utilities.splitByNewline');
        await new Promise(resolve => setTimeout(resolve, 100));
        await vscode.commands.executeCommand('cursorRight');
        await vscode.commands.executeCommand('type', { text: '+' });

        const expected = 'joe, boe, woe+\n            moe,b foe,c doe,d+\n' +
            '            bill+\n            phill+\n        +';
        assert.strictEqual(editor.document.getText(), expected);
    });

    test('can split by regex', async () => {
        await vscode.commands.executeCommand('selection-utilities.splitByRegex', {
            text: ',[a-z]\\s*',
        });
        await new Promise(resolve => setTimeout(resolve, 100));
        await vscode.commands.executeCommand('cursorRight');
        await vscode.commands.executeCommand('type', { text: '+' });

        const expected = 'joe, boe, woe\n            moe+,b foe+,c doe+,d\n' +
            '            bill\n            phill\n        +';
        assert.strictEqual(editor.document.getText(), expected);
    });

    test('can create by string', async () => {
        await vscode.commands.executeCommand('selection-utilities.createBy', {
            text: 'oe',
        });
        await new Promise(resolve => setTimeout(resolve, 100));
        await vscode.commands.executeCommand('cursorRight');
        await vscode.commands.executeCommand('type', { text: '+' });

        const expected = 'joe+, boe+, woe+\n            moe+,b foe+,c doe+,d\n' +
            '            bill\n            phill\n        ';
        assert.strictEqual(editor.document.getText(), expected);
    });

    test('can create by regex', async () => {
        await vscode.commands.executeCommand('selection-utilities.createByRegex', {
            text: '[a-z]\\s+',
        });
        await new Promise(resolve => setTimeout(resolve, 100));
        await vscode.commands.executeCommand('cursorRight');
        await vscode.commands.executeCommand('type', { text: '+' });

        const expected = 'joe, boe, woe\n            moe,b +foe,c +doe,d\n' +
            '            bill\n            phill\n        ';
        assert.strictEqual(editor.document.getText(), expected);
    });
});
