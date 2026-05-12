import * as vscode from 'vscode';
import * as assert from 'assert';
import { editorWithText, cursorToPos, cleanWhitespace } from './utils';

suite('Paragraph Motion', () => {
    let editor: vscode.TextEditor;

    async function parMoveSelects(cmd: Record<string, unknown>, expected: string) {
        await vscode.commands.executeCommand('selection-utilities.moveBy', {
            unit: 'paragraph',
            value: 1,
            ...cmd,
        });
        const selected = editor.document.getText(editor.selection);
        assert.equal(cleanWhitespace(selected), cleanWhitespace(expected));
    }

    setup(async () => {
        const text = cleanWhitespace(`aaaa
            aaaa

            bbbb
            bbbb
            bbbb


            cccc
            cccc
            `);
        [editor] = await editorWithText(text);
    });

    test('Can move by start+end', async () => {
        cursorToPos(editor, 0, 0);
        await parMoveSelects(
            { selectWhole: true, boundary: 'both' },
            `aaaa
            aaaa`,
        );
    });

    test('Can move by start+end from middle', async () => {
        cursorToPos(editor, 1, 0);
        await parMoveSelects(
            { selectWhole: true, boundary: 'both' },
            `aaaa
            aaaa`,
        );
    });

    test('Can move by start', async () => {
        cursorToPos(editor, 0, 0);
        await parMoveSelects(
            { selectWhole: true, boundary: 'start' },
            `aaaa
            aaaa

            `,
        );
        await parMoveSelects(
            { selectWhole: true, boundary: 'start' },
            `bbbb
            bbbb
            bbbb


            `,
        );
    });

    test('Can move by end', async () => {
        cursorToPos(editor, 0, 0);
        await parMoveSelects(
            { selectWhole: true, boundary: 'end' },
            `aaaa
            aaaa`,
        );
        await parMoveSelects(
            { selectWhole: true, boundary: 'end' },
            `

            bbbb
            bbbb
            bbbb`,
        );
    });

    test('Can move backwards by start', async () => {
        cursorToPos(editor, 5, 0);
        await parMoveSelects(
            { selectWhole: true, boundary: 'start', value: -1 },
            `bbbb
            bbbb
            bbbb


            `,
        );
    });

    test('Can move backwards by end', async () => {
        cursorToPos(editor, 5, 0);
        await parMoveSelects(
            { selectWhole: true, boundary: 'end', value: -1 },
            `

            bbbb
            bbbb
            bbbb`,
        );
    });

    test('Can move backwards by start+end', async () => {
        cursorToPos(editor, 5, 0);
        await parMoveSelects(
            { selectWhole: true, boundary: 'both', value: -1 },
            `bbbb
            bbbb
            bbbb`,
        );
    });

    test('Can extend forward by start', async () => {
        cursorToPos(editor, 1, 0);
        await parMoveSelects(
            { select: true, boundary: 'start' },
            `aaaa

            `,
        );
        await parMoveSelects(
            { select: true, boundary: 'start' },
            `aaaa

            bbbb
            bbbb
            bbbb


            `,
        );
    });

    test('Can extend forward by end', async () => {
        cursorToPos(editor, 1, 0);
        await parMoveSelects({ select: true, boundary: 'end' }, 'aaaa');
        await parMoveSelects(
            { select: true, boundary: 'end' },
            `aaaa

            bbbb
            bbbb
            bbbb`,
        );
    });

    test('Can extend backwards by start', async () => {
        cursorToPos(editor, 5, 0);
        await parMoveSelects(
            { select: true, boundary: 'start', value: -1 },
            `bbbb
            bbbb
            `,
        );
        await parMoveSelects(
            { select: true, boundary: 'start', value: -1 },
            `aaaa
            aaaa

            bbbb
            bbbb
            `,
        );
    });

    test('Can extend backwards by end', async () => {
        cursorToPos(editor, 5, 0);
        await parMoveSelects(
            { select: true, boundary: 'end', value: -1 },
            `

            bbbb
            bbbb
            `,
        );
        await parMoveSelects(
            { select: true, boundary: 'end', value: -1 },
            `aaaa
            aaaa

            bbbb
            bbbb
            `,
        );
    });

    test('Can extend to start at file end', async () => {
        cursorToPos(editor, 8, 0);
        await parMoveSelects(
            { select: true, boundary: 'start', value: 1 },
            `cccc
            cccc
            `,
        );
    });

    test('Can extend to end at file start', async () => {
        cursorToPos(editor, 1, 0);
        await parMoveSelects(
            { select: true, boundary: 'end', value: -1 },
            `aaaa
            `,
        );
    });

    test('Can extend to end at file end', async () => {
        cursorToPos(editor, 9, 4);
        await parMoveSelects(
            { select: true, boundary: 'end', value: 1 },
            `
            `,
        );
    });

    test('Can extend to start at file start', async () => {
        cursorToPos(editor, 1, 0);
        await parMoveSelects(
            { select: true, boundary: 'start', value: -1 },
            `aaaa
            `,
        );
    });
});
