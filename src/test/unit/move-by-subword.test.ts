import * as vscode from 'vscode';
import * as assert from 'assert';
import { editorWithText, cursorToPos } from './utils';

suite('Subword Motion', () => {
    let editor: vscode.TextEditor;

    async function wordMoveSelects(cmd: Record<string, unknown>, expected: string) {
        await vscode.commands.executeCommand('selection-utilities.moveBy', {
            unit: 'subword',
            value: 1,
            ...cmd,
        });
        assert.equal(editor.document.getText(editor.selection), expected);
    }

    setup(async () => {
        [editor] = await editorWithText('foo bar biz baz snake_case_ident');
    });

    test('Can move by start+end', async () => {
        cursorToPos(editor, 0, 0);
        await wordMoveSelects({ selectWhole: true, boundary: 'both' }, 'foo');
        await wordMoveSelects({ selectWhole: true, boundary: 'both' }, 'bar');
    });

    test('Can move by start+end from middle', async () => {
        cursorToPos(editor, 0, 1);
        await wordMoveSelects({ selectWhole: true, boundary: 'both' }, 'foo');
    });

    test('Can move by start', async () => {
        cursorToPos(editor, 0, 0);
        await wordMoveSelects({ selectWhole: true, boundary: 'start' }, 'foo ');
        await wordMoveSelects({ selectWhole: true, boundary: 'start' }, 'bar ');
    });

    test('Can move by end', async () => {
        cursorToPos(editor, 0, 0);
        await wordMoveSelects({ selectWhole: true, boundary: 'end' }, 'foo');
        await wordMoveSelects({ selectWhole: true, boundary: 'end' }, ' bar');
    });

    test('Can move backwards by start', async () => {
        cursorToPos(editor, 0, 19);
        await wordMoveSelects(
            { selectWhole: true, boundary: 'start', value: -1 },
            'snake_',
        );
    });

    test('Can move backwards by end', async () => {
        cursorToPos(editor, 0, 19);
        await wordMoveSelects({ selectWhole: true, boundary: 'end', value: -1 }, ' snake_');
    });

    test('Can move backwards by start+end', async () => {
        cursorToPos(editor, 0, 19);
        await wordMoveSelects({ selectWhole: true, boundary: 'both', value: -1 }, 'snake_');
    });

    test('Can extend forward by start', async () => {
        cursorToPos(editor, 0, 1);
        await wordMoveSelects({ select: true, boundary: 'start' }, 'oo ');
        await wordMoveSelects({ select: true, boundary: 'start' }, 'oo bar ');
        await vscode.commands.executeCommand('selection-utilities.exchangeAnchorActive');
        await wordMoveSelects({ select: true, boundary: 'start' }, 'bar ');
    });

    test('Can extend forward by end', async () => {
        cursorToPos(editor, 0, 1);
        await wordMoveSelects({ select: true, boundary: 'end' }, 'oo');
        await wordMoveSelects({ select: true, boundary: 'end' }, 'oo bar');
        await vscode.commands.executeCommand('selection-utilities.exchangeAnchorActive');
        await wordMoveSelects({ select: true, boundary: 'end' }, ' bar');
    });

    test('Can extend backwards by start', async () => {
        cursorToPos(editor, 0, 6);
        await wordMoveSelects({ select: true, boundary: 'start', value: -1 }, 'ba');
        await wordMoveSelects({ select: true, boundary: 'start', value: -1 }, 'foo ba');
        await vscode.commands.executeCommand('selection-utilities.exchangeAnchorActive');
        await wordMoveSelects({ select: true, boundary: 'start', value: -1 }, 'foo ');
    });

    test('Can extend backwards by end', async () => {
        cursorToPos(editor, 0, 6);
        await wordMoveSelects({ select: true, boundary: 'end', value: -1 }, ' ba');
        await wordMoveSelects({
            select: true,
            boundary: 'end',
            value: -1,
        },
        'foo ba');
        await vscode.commands.executeCommand('selection-utilities.exchangeAnchorActive');
        await wordMoveSelects({ select: true, boundary: 'end', value: -1 }, 'foo');
    });

    test('Can extend to "start" at file end', async () => {
        cursorToPos(editor, 0, 28);
        await wordMoveSelects({ select: true, boundary: 'start', value: 1 }, 'dent');
    });

    test('Can extend to "end" at file start', async () => {
        cursorToPos(editor, 0, 2);
        await wordMoveSelects({ select: true, boundary: 'end', value: -1 }, 'fo');
    });

    test('Can extend to "end" at file end', async () => {
        cursorToPos(editor, 0, 28);
        await wordMoveSelects({ select: true, boundary: 'end', value: 1 }, 'dent');
    });

    test('Can extend to "start" at file start', async () => {
        cursorToPos(editor, 0, 2);
        await wordMoveSelects({ select: true, boundary: 'start', value: -1 }, 'fo');
    });
});
