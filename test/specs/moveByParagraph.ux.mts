// start with just some basic tests to verify all is well

import '@wdio/globals';
import 'wdio-vscode-service';
import {setupEditor, storeCoverageStats, waitUntilCursorUnmoving} from './utils.mts';
import {TextEditor, Workbench} from 'wdio-vscode-service';
import replaceAll from 'string.prototype.replaceall';

describe('Paragraph Motion', () => {
    let editor: TextEditor;
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    let workbench: Workbench;
    before(async () => {
        editor = await setupEditor(`
            aaaa
            aaaa

            bbbb
            bbbb
            bbbb


            cccc
            cccc
        `);
        workbench = await browser.getWorkbench();
    });

    async function parMoveSelects(cmd: object, str: string) {
        const moveWord = {
            unit: 'paragraph',
            value: 1,
        };
        str = replaceAll(str, /^\s+/g, '');
        await browser.executeWorkbench(vscode =>
            vscode.commands.executeCommand('selection-utilities.moveBy', {...moveWord, cmd})
        );
        await waitUntilCursorUnmoving(editor);
        expect(await editor.getSelectedText()).toEqual(str);
    }

    it('Can move by start+end', async () => {
        await editor.moveCursor(1, 1);

        await parMoveSelects(
            {selectWhole: true, boundary: 'both'},
            `aaaa
            aaaa`
        );
    });

    it('Can move by start+end from middle', async () => {
        await editor.moveCursor(2, 1);
        await parMoveSelects(
            {selectWhole: true, boundary: 'both'},
            `aaaa
            aaaa`
        );
    });

    it('Can move by start', async () => {
        await editor.moveCursor(1, 1);

        await parMoveSelects(
            {selectWhole: true, boundary: 'start'},
            `aaaa
            aaaa

            `
        );
        await parMoveSelects(
            {selectWhole: true, boundary: 'start'},
            `bbbb
            bbbb
            bbbb


            `
        );
    });

    it('Can move by end', async () => {
        await editor.moveCursor(1, 1);

        await parMoveSelects(
            {selectWhole: true, boundary: 'end'},
            `
            aaaa
            aaaa`
        );
        await parMoveSelects(
            {selectWhole: true, boundary: 'end'},
            `

            bbbb
            bbbb
            bbbb`
        );
    });

    it('Can move backwards by start', async () => {
        await editor.moveCursor(6, 1);

        await parMoveSelects(
            {selectWhole: true, boundary: 'start', value: -1},
            `bbbb
            bbbb
            bbbb


            `
        );
    });

    it('Can move backwards by end', async () => {
        await editor.moveCursor(6, 1);

        await parMoveSelects(
            {selectWhole: true, boundary: 'end', value: -1},
            `

            bbbb
            bbbb
            bbbb`
        );
    });

    it('Can move backwards by start+end', async () => {
        await editor.moveCursor(6, 1);

        await parMoveSelects(
            {selectWhole: true, boundary: 'both', value: -1},
            `bbbb
            bbbb
            bbbb`
        );
    });

    it('Can extend forward by start', async () => {
        await editor.moveCursor(2, 1);

        await parMoveSelects(
            {select: true, boundary: 'start'},
            `aaaa

            `
        );
        await parMoveSelects(
            {select: true, boundary: 'start'},
            `aaaa

            bbbb
            bbbb
            bbbb


            `
        );
    });

    it('Can extend forward by end', async () => {
        await editor.moveCursor(1, 2);

        await parMoveSelects({select: true, boundary: 'start'}, 'aaaa');
        await parMoveSelects(
            {select: true, boundary: 'start'},
            `aaaa

            bbbb
            bbbb
            bbbb`
        );
    });

    it('Can extend bakcwards by start', async () => {
        await editor.moveCursor(6, 1);

        await parMoveSelects(
            {select: true, boundary: 'start', value: -1},
            `bbbb
            bbbb`
        );
        await parMoveSelects(
            {select: true, boundary: 'start', value: -1},
            `aaaa
            aaaa

            bbbb
            bbbb`
        );
    });

    it('Can extend bakcwards by end', async () => {
        await editor.moveCursor(6, 1);

        await parMoveSelects(
            {select: true, boundary: 'end', value: -1},
            `bbbb
            bbbb`
        );
        await parMoveSelects(
            {select: true, boundary: 'end', value: -1},
            `aaaa
            aaaa

            bbbb
            bbbb`
        );
    });

    it('Can extent to "start" at file end', async () => {
        await editor.moveCursor(9, 1);

        await parMoveSelects(
            {select: true, boundary: 'start', value: 1},
            `cccc
            cccc
            `
        );
    });

    it('Can extent to "end" at file start', async () => {
        await editor.moveCursor(2, 1);

        await parMoveSelects(
            {select: true, boundary: 'end', value: -1},
            `aaaa
            `
        );
    });

    // handle edge case of start/end of file

    after(async () => {
        await storeCoverageStats('simpleMotion');
    });
});
