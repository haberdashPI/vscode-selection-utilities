import * as vscode from 'vscode';
import * as assert from 'assert';
import { editorWithText, cursorToPos, cleanWhitespace } from './utils';

suite('Section Motion', () => {
    let editor: vscode.TextEditor;

    async function parMoveSelects(cmd: Record<string, unknown>, expected: string) {
        await vscode.commands.executeCommand('selection-utilities.moveBy', {
            unit: 'subsection',
            value: 1,
            ...cmd,
        });
        const selected = editor.document.getText(editor.selection);
        assert.equal(cleanWhitespace(selected), cleanWhitespace(expected));
    }

    setup(async () => {
        const text = cleanWhitespace(`# A
            # --------------------

            joebob
            bizzle

            # B
            # --------------------

            billybob
            bim

            # A.2
            # --------------------

            wizard
            bizard
            milo
            philo
            dough
            `);
        [editor] = await editorWithText(text);
    });

    test('Can move by start+end', async () => {
        cursorToPos(editor, 0, 0);
        await parMoveSelects(
            { selectWhole: true, boundary: 'both' },
            `# A
             # --------------------`,
        );
    });

    test('Can move by start+end from middle', async () => {
        cursorToPos(editor, 1, 2);
        await parMoveSelects(
            { selectWhole: true, boundary: 'both' },
            `# A
             # --------------------`,
        );
    });

    test('Can move by start', async () => {
        cursorToPos(editor, 0, 0);
        await parMoveSelects(
            { selectWhole: true, boundary: 'start' },
            `# A
            # --------------------

            joebob
            bizzle

            `,
        );
        await parMoveSelects(
            { selectWhole: true, boundary: 'start' },
            `# B
            # --------------------

            billybob
            bim

            `,
        );
        cursorToPos(editor, 9, 0);
        await parMoveSelects(
            { selectWhole: true, boundary: 'start' },
            `# B
            # --------------------

            billybob
            bim

            `,
        );
    });

    test('Can move by end', async () => {
        cursorToPos(editor, 0, 0);
        await parMoveSelects(
            { selectWhole: true, boundary: 'end' },
            `# A
            # --------------------`,
        );
        await parMoveSelects(
            { selectWhole: true, boundary: 'end' },
            `

            joebob
            bizzle

            # B
            # --------------------`,
        );
        cursorToPos(editor, 8, 0);
        await parMoveSelects(
            { selectWhole: true, boundary: 'end' },
            `

            billybob
            bim

            # A.2
            # --------------------`,
        );
    });

    test('Can move backwards by start', async () => {
        cursorToPos(editor, 8, 0);
        await parMoveSelects(
            { selectWhole: true, boundary: 'start', value: -1 },
            `# B
            # --------------------

            billybob
            bim

            `,
        );
    });

    test('Can move backwards by end', async () => {
        cursorToPos(editor, 8, 0);
        await parMoveSelects(
            { selectWhole: true, boundary: 'end', value: -1 },
            `

            billybob
            bim

            # A.2
            # --------------------`,
        );
        await parMoveSelects(
            { selectWhole: true, boundary: 'end', value: -1 },
            `

            joebob
            bizzle

            # B
            # --------------------`,
        );
    });

    test('Can move backwards by start+end', async () => {
        cursorToPos(editor, 8, 0);
        await parMoveSelects(
            { selectWhole: true, boundary: 'both', value: -1 },
            `# B
             # --------------------`,
        );
    });

    test('Can extend forward by start', async () => {
        cursorToPos(editor, 1, 0);
        await parMoveSelects(
            { select: true, boundary: 'start' },
            `# --------------------

            joebob
            bizzle

            `,
        );
        await parMoveSelects(
            { select: true, boundary: 'start' },
            `# --------------------

            joebob
            bizzle

            # B
            # --------------------

            billybob
            bim

            `,
        );
    });

    test('Can extend forward by end', async () => {
        cursorToPos(editor, 1, 0);
        await parMoveSelects({ select: true, boundary: 'end' }, '# --------------------');
        await parMoveSelects(
            { select: true, boundary: 'end' },
            `# --------------------

            joebob
            bizzle

            # B
            # --------------------`,
        );
    });

    test('Can extend backwards by start', async () => {
        cursorToPos(editor, 10, 0);
        await parMoveSelects(
            { select: true, boundary: 'start', value: -1 },
            `# B
             # --------------------

             billybob
            `,
        );
        await parMoveSelects(
            { select: true, boundary: 'start', value: -1 },
            `# A
             # --------------------

             joebob
             bizzle

             # B
             # --------------------

             billybob
            `,
        );
    });

    test('Can extend backwards by end', async () => {
        cursorToPos(editor, 10, 0);
        await parMoveSelects(
            { select: true, boundary: 'end', value: -1 },
            `

             billybob
            `,
        );
        await parMoveSelects(
            { select: true, boundary: 'end', value: -1 },
            `

             joebob
             bizzle

             # B
             # --------------------

             billybob
            `,
        );
    });

    test('Can extend to start at file end', async () => {
        cursorToPos(editor, 15, 0);
        await parMoveSelects(
            { select: true, boundary: 'start', value: 1 },
            `wizard
            bizard
            milo
            philo
            dough
            `,
        );
    });

    test('Can extend to end at file start', async () => {
        cursorToPos(editor, 1, 0);
        await parMoveSelects(
            { select: true, boundary: 'end', value: -1 },
            `# A
            `,
        );
    });

    test('Can extend to end at file end', async () => {
        cursorToPos(editor, 15, 0);
        await parMoveSelects(
            { select: true, boundary: 'end', value: 1 },
            `wizard
            bizard
            milo
            philo
            dough
            `,
        );
    });

    test('Can extend to start at file start', async () => {
        cursorToPos(editor, 1, 0);
        await parMoveSelects(
            { select: true, boundary: 'start', value: -1 },
            `# A
            `,
        );
    });
});
