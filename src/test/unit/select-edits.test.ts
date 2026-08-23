import * as vscode from 'vscode';
import * as assert from 'assert';
import { editorWithText, cursorToPos } from './utils';

suite('Selection edits', () => {
    let editor: vscode.TextEditor;
    const startText = 'foo bar biz foo biz bar foo biz foo';

    setup(async () => {
        [editor] = await editorWithText(startText);
    });

    test('can add by match', async () => {
        cursorToPos(editor, 0, 0);
        await vscode.commands.executeCommand('selection-utilities.moveBy', {
            unit: 'word',
            value: 1,
            select: true,
            boundary: 'both',
        });
        await vscode.commands.executeCommand('selection-utilities.addNext');
        await vscode.commands.executeCommand('deleteRight');

        assert.equal(editor.document.getText(), ' bar biz  biz bar foo biz foo');
    });

    test('can cancel selections', async () => {
        cursorToPos(editor, 0, 0);
        await vscode.commands.executeCommand('selection-utilities.moveBy', {
            unit: 'word',
            value: 1,
            select: true,
            boundary: 'both',
        });
        await vscode.commands.executeCommand('selection-utilities.addNext');
        await vscode.commands.executeCommand('selection-utilities.cancelSelection');
        await vscode.commands.executeCommand('deleteRight');

        assert.equal(editor.document.getText(), 'foo bar biz foobiz bar foo biz foo');

        await vscode.commands.executeCommand('selection-utilities.restoreAndClear', {
            register: 'cancel',
        });
        await vscode.commands.executeCommand('deleteRight');

        assert.equal(editor.document.getText(), ' bar biz biz bar foo biz foo');
    });

    test('can skip by match', async () => {
        cursorToPos(editor, 0, 0);
        await vscode.commands.executeCommand('selection-utilities.moveBy', {
            unit: 'word',
            value: 1,
            select: true,
            boundary: 'both',
        });
        await vscode.commands.executeCommand('selection-utilities.addNext');
        await vscode.commands.executeCommand('selection-utilities.skipNext');
        await vscode.commands.executeCommand('deleteRight');

        assert.equal(editor.document.getText(), ' bar biz foo biz bar  biz foo');
    });

    test('can add prev by match', async () => {
        cursorToPos(editor, 0, 0);
        await vscode.commands.executeCommand('selection-utilities.moveBy', {
            unit: 'word',
            value: 1,
            select: true,
            boundary: 'both',
        });
        await vscode.commands.executeCommand('selection-utilities.addPrev');
        await vscode.commands.executeCommand('deleteRight');

        assert.equal(editor.document.getText(), ' bar biz foo biz bar foo biz ');
    });

    test('can skip prev by match', async () => {
        cursorToPos(editor, 0, 0);
        await vscode.commands.executeCommand('selection-utilities.moveBy', {
            unit: 'word',
            value: 1,
            select: true,
            boundary: 'both',
        });
        await vscode.commands.executeCommand('selection-utilities.addPrev');
        await vscode.commands.executeCommand('selection-utilities.skipPrev');
        await vscode.commands.executeCommand('deleteRight');

        assert.equal(editor.document.getText(), ' bar biz foo biz bar  biz foo');
    });

    test('can move and delete primary selection', async () => {
        await vscode.commands.executeCommand('editor.action.selectHighlights');
        await vscode.commands.executeCommand('selection-utilities.movePrimaryRight');
        await vscode.commands.executeCommand('selection-utilities.movePrimaryRight');
        await vscode.commands.executeCommand('selection-utilities.movePrimaryLeft');
        await vscode.commands.executeCommand('selection-utilities.deletePrimary');
        await vscode.commands.executeCommand('deleteRight');

        assert.equal(editor.document.getText(), ' bar biz  biz bar foo biz ');
    });

    test('can save and restore selections', async () => {
        cursorToPos(editor, 0, 0);
        for (let i = 0; i < 3; i++) {
            await vscode.commands.executeCommand('selection-utilities.moveBy', {
                unit: 'word',
                value: 1,
                selectWhole: true,
                boundary: 'both',
            });
            await vscode.commands.executeCommand('selection-utilities.appendToMemory');
        }
        await vscode.commands.executeCommand('selection-utilities.moveBy', {
            unit: 'word',
            value: 1,
            selectWhole: true,
            boundary: 'both',
        });
        await vscode.commands.executeCommand('selection-utilities.deleteLastSaved');
        await vscode.commands.executeCommand('selection-utilities.restoreAndClear');
        await vscode.commands.executeCommand('deleteRight');

        assert.equal(editor.document.getText(), '  biz foo biz bar foo biz foo');
    });

    test('can clear selection memory', async () => {
        cursorToPos(editor, 0, 0);
        await vscode.commands.executeCommand('selection-utilities.moveBy', {
            unit: 'word',
            value: 1,
            selectWhole: true,
            boundary: 'both',
        });
        await vscode.commands.executeCommand('selection-utilities.appendToMemory');
        await vscode.commands.executeCommand('selection-utilities.moveBy', {
            unit: 'word',
            value: 1,
            selectWhole: true,
            boundary: 'both',
        });
        await vscode.commands.executeCommand('selection-utilities.appendToMemory');

        await vscode.commands.executeCommand('selection-utilities.clearMemory');
        await vscode.commands.executeCommand('selection-utilities.cancelSelection');
        await vscode.commands.executeCommand('selection-utilities.restoreAndClear');
        await vscode.commands.executeCommand('deleteLeft');

        assert.equal(editor.document.getText(), 'foo ba biz foo biz bar foo biz foo');
    });

    test('can swap regions', async () => {
        cursorToPos(editor, 0, 0);
        await new Promise(resolve => setTimeout(resolve, 100));
        await vscode.commands.executeCommand('selection-utilities.moveBy', {
            unit: 'word',
            value: 1,
            selectWhole: true,
            boundary: 'both',
        });
        await new Promise(resolve => setTimeout(resolve, 100));
        await vscode.commands.executeCommand('selection-utilities.swapWithMemory');
        await new Promise(resolve => setTimeout(resolve, 100));

        await vscode.commands.executeCommand('selection-utilities.moveBy', {
            unit: 'word',
            value: 1,
            selectWhole: true,
            boundary: 'both',
        });
        await vscode.commands.executeCommand('selection-utilities.swapWithMemory');
        await new Promise(resolve => setTimeout(resolve, 100));

        assert.equal(editor.document.getText(), 'bar foo biz foo biz bar foo biz foo');
    });

    test('can move symmetrically', async () => {
        cursorToPos(editor, 0, 0);
        await vscode.commands.executeCommand('selection-utilities.moveBy', {
            unit: 'word',
            value: 1,
            selectWhole: true,
            boundary: 'both',
        });
        await vscode.commands.executeCommand('selection-utilities.moveBy', {
            unit: 'word',
            value: 1,
            selectWhole: true,
            boundary: 'both',
        });
        await vscode.commands.executeCommand('selection-utilities.adjustSelections', {
            dir: 'inward',
            count: 1,
        });

        assert.equal(editor.document.getText(editor.selection), 'a');

        await vscode.commands.executeCommand('selection-utilities.adjustSelections', {
            dir: 'outward',
            count: 2,
        });

        assert.equal(editor.document.getText(editor.selection), ' bar ');
    });

    test('can trim whitespace', async () => {
        cursorToPos(editor, 0, 0);
        await vscode.commands.executeCommand('selection-utilities.moveBy', {
            unit: 'word',
            value: 1,
            selectWhole: true,
            boundary: 'both',
        });
        await vscode.commands.executeCommand('selection-utilities.moveBy', {
            unit: 'word',
            value: 1,
            selectWhole: true,
            boundary: 'both',
        });
        await vscode.commands.executeCommand('selection-utilities.adjustSelections', {
            dir: 'outward',
            count: 1,
        });
        await vscode.commands.executeCommand('selection-utilities.trimSelectionWhitespace');

        assert.equal(editor.document.getText(editor.selection), 'bar');
    });

    suite('appendToMemory with empty selection', () => {
        test('expands to surrounding word by default', async () => {
            cursorToPos(editor, 0, 1);
            await vscode.commands.executeCommand('selection-utilities.appendToMemory');
            await vscode.commands.executeCommand('selection-utilities.restoreAndClear');

            assert.equal(editor.selection.isEmpty, false);
            assert.equal(editor.selection.start.character, 0);
            assert.equal(editor.selection.end.character, 3);
        });

        test('saves empty selection as-is when selectWordOnEmpty is false', async () => {
            cursorToPos(editor, 0, 1);
            await vscode.commands.executeCommand('selection-utilities.appendToMemory', {
                selectWordOnEmpty: false,
            });
            await vscode.commands.executeCommand('selection-utilities.restoreAndClear');

            assert.equal(editor.selection.isEmpty, true);
            assert.equal(editor.selection.active.line, 0);
            assert.equal(editor.selection.active.character, 1);
        });
    });
});
