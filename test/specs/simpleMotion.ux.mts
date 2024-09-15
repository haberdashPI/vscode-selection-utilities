// start with just some basic tests to verify all is well

import '@wdio/globals';
import 'wdio-vscode-service';
import {setupEditor, storeCoverageStats, waitUntilCursorUnmoving} from './utils.mts';
import {TextEditor, Workbench} from 'wdio-vscode-service';

describe('Subword Motion', () => {
    let editor: TextEditor;
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    let workbench: Workbench;
    before(async () => {
        editor = await setupEditor('foo bar biz baz snake_case_ident');
        workbench = await browser.getWorkbench();
    });

    async function wordMoveSelects(cmd: object, str: string) {
        const moveWord = {
            unit: 'subword',
            value: 1,
        };
        await browser.executeWorkbench(vscode =>
            vscode.commands.executeCommand('selection-utilities.moveBy', {...moveWord, cmd})
        );
        await waitUntilCursorUnmoving(editor);
        expect(await editor.getSelectedText()).toEqual(str);
    }

    it('Can move by start+end', async () => {
        await editor.moveCursor(1, 1);

        await wordMoveSelects({selectWhole: true, boundary: 'both'}, 'foo');
        await wordMoveSelects({selectWhole: true, boundary: 'both'}, 'bar');
    });

    it('Can move by start+end from middle', async () => {
        await editor.moveCursor(1, 2);
        await wordMoveSelects({selectWhole: true, boundary: 'both'}, 'foo');
    });

    it('Can move by start', async () => {
        await editor.moveCursor(1, 1);

        await wordMoveSelects({selectWhole: true, boundary: 'start'}, 'foo ');
        await wordMoveSelects({selectWhole: true, boundary: 'start'}, 'bar ');
    });

    it('Can move by end', async () => {
        await editor.moveCursor(1, 1);

        await wordMoveSelects({selectWhole: true, boundary: 'start'}, 'foo');
        await wordMoveSelects({selectWhole: true, boundary: 'start'}, ' bar');
    });

    it('Can move backwards by start', async () => {
        await editor.moveCursor(1, 20);

        await wordMoveSelects({selectWhole: true, boundary: 'start', value: -1}, 'snake_');
    });

    it('Can move backwards by start', async () => {
        await editor.moveCursor(1, 20);

        await wordMoveSelects({selectWhole: true, boundary: 'end', value: -1}, ' snake_');
    });

    it('Can move backwards by start+end', async () => {
        await editor.moveCursor(1, 20);

        await wordMoveSelects({selectWhole: true, boundary: 'both', value: -1}, 'snake_');
    });

    it('Can extend forward by start', async () => {
        await editor.moveCursor(1, 2);

        await wordMoveSelects({select: true, boundary: 'start'}, 'oo ');
        await wordMoveSelects({select: true, boundary: 'start'}, 'oo bar ');
    });

    it('Can extend forward by end', async () => {
        await editor.moveCursor(1, 2);

        await wordMoveSelects({select: true, boundary: 'start'}, 'oo');
        await wordMoveSelects({select: true, boundary: 'start'}, 'oo bar');
    });

    it('Can extend bakcwards by start', async () => {
        await editor.moveCursor(1, 7);

        await wordMoveSelects({select: true, boundary: 'start', value: -1}, 'ba');
        await wordMoveSelects({select: true, boundary: 'start', value: -1}, 'foo ba');
    });

    it('Can extend bakcwards by end', async () => {
        await editor.moveCursor(1, 7);

        await wordMoveSelects({select: true, boundary: 'start', value: -1}, ' ba');
        await wordMoveSelects({select: true, boundary: 'start', value: -1}, 'foo ba');
    });

    // other cases...

    after(async () => {
        await storeCoverageStats('simpleMotion');
    });
});
