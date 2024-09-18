// start with just some basic tests to verify all is well

import '@wdio/globals';
import 'wdio-vscode-service';
import {
    cleanWhitespace,
    setupEditor,
    storeCoverageStats,
    waitUntilCursorUnmoving,
} from './utils.mts';
import {TextEditor} from 'wdio-vscode-service';

describe('Paragraph Motion', () => {
    let editor: TextEditor;
    before(async () => {
        editor = await setupEditor(`// A
            // --------------------

            joebob
            bizzle

            // B
            // --------------------

            billybob
            bim

            // A.2
            // --------------------

            wizard
            bizard
            milo
            philo
            dough


            `);
    });

    async function parMoveSelects(cmd: object, str: string) {
        str = cleanWhitespace(str);
        await browser.executeWorkbench((vscode, cmd) => {
            const defaults = {
                unit: 'subsection',
                value: 1,
            };
            vscode.commands.executeCommand('selection-utilities.moveBy', {
                ...defaults,
                ...cmd,
            });
        }, cmd);
        await waitUntilCursorUnmoving(editor);
        const result = await editor.getSelectedText();
        expect(cleanWhitespace(result)).toEqual(str);
    }

    it('Can move by start+end', async () => {
        await editor.moveCursor(1, 1);

        await parMoveSelects(
            {selectWhole: true, boundary: 'both'},
            `// A
             // --------------------`
        );
    });

    it('Can move by start+end from middle', async () => {
        await editor.moveCursor(2, 3);
        await parMoveSelects(
            {selectWhole: true, boundary: 'both'},
            `// A
             // --------------------`
        );
    });

    it('Can move by start', async () => {
        await editor.moveCursor(1, 1);

        await parMoveSelects(
            {selectWhole: true, boundary: 'start'},
            `// A
            // --------------------

            joebob
            bizzle

            `
        );
        await parMoveSelects(
            {selectWhole: true, boundary: 'start'},
            `// B
            // --------------------

            billybob
            bim

            `
        );
    });

    it('Can move by end', async () => {
        await editor.moveCursor(1, 1);

        await parMoveSelects(
            {selectWhole: true, boundary: 'end'},
            `// A
            // --------------------`
        );
        await parMoveSelects(
            {selectWhole: true, boundary: 'end'},
            `

            joebob
            bizzle

            // B
            // --------------------`
        );
    });

    it('Can move backwards by start', async () => {
        await editor.moveCursor(9, 1);

        await parMoveSelects(
            {selectWhole: true, boundary: 'start', value: -1},
            `// B
            // --------------------

            billybob
            bim

            `
        );
    });

    it('Can move backwards by end', async () => {
        await editor.moveCursor(9, 1);

        await parMoveSelects(
            {selectWhole: true, boundary: 'end', value: -1},
            `

            billybob
            bim

            // A.2
            // --------------------`
        );
    });

    it('Can move backwards by start+end', async () => {
        await editor.moveCursor(9, 1);

        await parMoveSelects(
            {selectWhole: true, boundary: 'both', value: -1},
            `// B
             // --------------------`
        );
    });

    it('Can extend forward by start', async () => {
        await editor.moveCursor(2, 1);

        await parMoveSelects(
            {select: true, boundary: 'start'},
            `// --------------------

            joebob
            bizzle

            `
        );
        await parMoveSelects(
            {select: true, boundary: 'start'},
            `// --------------------

            joebob
            bizzle

            // B
            // --------------------

            billybob
            bim

            `
        );
    });

    it('Can extend forward by end', async () => {
        await editor.moveCursor(2, 1);

        await parMoveSelects({select: true, boundary: 'end'}, 'aaaa');
        await parMoveSelects(
            {select: true, boundary: 'end'},
            `// --------------------

            joebob
            bizzle

            // B
            // --------------------`
        );
    });

    it('Can extend bakcwards by start', async () => {
        await editor.moveCursor(9, 1);

        await parMoveSelects(
            {select: true, boundary: 'start', value: -1},
            `// B
             // --------------------


             billybob
            `
        );
        await parMoveSelects(
            {select: true, boundary: 'start', value: -1},
            `// A
             // --------------------

             joebob
             bizzle

             // B
             // --------------------


             billybob
            `
        );
    });

    it('Can extend bakcwards by end', async () => {
        await editor.moveCursor(6, 1);

        await parMoveSelects(
            {select: true, boundary: 'end', value: -1},
            `


             billybob
            `
        );
        await parMoveSelects(
            {select: true, boundary: 'end', value: -1},
            `

             joebob
             bizzle

             // B
             // --------------------


             billybob
            `
        );
    });

    it('Can extent to "start" at file end', async () => {
        await editor.moveCursor(12, 1);

        await parMoveSelects(
            {select: true, boundary: 'start', value: 1},
            `// A.2
            // --------------------

            wizard
            bizard
            milo
            philo
            dough


            `
        );
    });

    it('Can extent to "end" at file start', async () => {
        await editor.moveCursor(4, 1);

        await parMoveSelects(
            {select: true, boundary: 'end', value: -1},
            `// A
            // --------------------

            joebob
            `
        );
    });

    after(async () => {
        await storeCoverageStats('sectionMotion');
    });
});
