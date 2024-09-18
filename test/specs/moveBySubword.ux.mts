// start with just some basic tests to verify all is well

import '@wdio/globals';
import 'wdio-vscode-service';
import {setupEditor, storeCoverageStats, waitUntilCursorUnmoving} from './utils.mts';
import {TextEditor} from 'wdio-vscode-service';

describe('Subword Motion', () => {
    let editor: TextEditor;
    before(async () => {
        editor = await setupEditor('foo bar biz baz snake_case_ident');
    });

    async function wordMoveSelects(cmd: object, str: string) {
        await browser.executeWorkbench((vscode, cmd) => {
            const defaults = {
                unit: 'subword',
                value: 1,
            };
            vscode.commands.executeCommand('selection-utilities.moveBy', {
                ...defaults,
                ...cmd,
            });
        }, cmd);
        await waitUntilCursorUnmoving(editor);
        expect(await editor.getSelectedText()).toEqual(str);
    }

    // eslint-disable-next-line no-restricted-properties
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

        await wordMoveSelects({selectWhole: true, boundary: 'end'}, 'foo');
        await wordMoveSelects({selectWhole: true, boundary: 'end'}, ' bar');
    });

    // TODO:
    // it('Keeps active to right moving forwards')

    it('Can move backwards by start', async () => {
        await editor.moveCursor(1, 20);

        await wordMoveSelects({selectWhole: true, boundary: 'start', value: -1}, 'snake_');
    });

    it('Can move backwards by end', async () => {
        await editor.moveCursor(1, 20);

        await wordMoveSelects({selectWhole: true, boundary: 'end', value: -1}, ' snake_');
    });

    it('Can move backwards by start+end', async () => {
        await editor.moveCursor(1, 20);

        await wordMoveSelects({selectWhole: true, boundary: 'both', value: -1}, 'snake_');
    });

    // TODO:
    // it('Keeps active to left moving backwards')

    it('Can extend forward by start', async () => {
        await editor.moveCursor(1, 2);

        await wordMoveSelects({select: true, boundary: 'start'}, 'oo ');
        await wordMoveSelects({select: true, boundary: 'start'}, 'oo bar ');
    });

    it('Can extend forward by end', async () => {
        await editor.moveCursor(1, 2);

        await wordMoveSelects({select: true, boundary: 'end'}, 'oo');
        await wordMoveSelects({select: true, boundary: 'end'}, 'oo bar');
    });

    // TODO:
    // it('Keeps active to right extending forwards')

    it('Can extend bakcwards by start', async () => {
        await editor.moveCursor(1, 7);

        await wordMoveSelects({select: true, boundary: 'start', value: -1}, 'ba');
        await wordMoveSelects({select: true, boundary: 'start', value: -1}, 'foo ba');
    });

    it('Can extend bakcwards by end', async () => {
        await editor.moveCursor(1, 7);

        await wordMoveSelects({select: true, boundary: 'end', value: -1}, ' ba');
        await wordMoveSelects({select: true, boundary: 'end', value: -1}, 'foo ba');
    });

    // TODO:
    // it('Keeps active to right extending backwards')

    it('Can extend to "start" at file end', async () => {
        await editor.moveCursor(1, 29);

        await wordMoveSelects({select: true, boundary: 'start', value: 1}, 'dent');
    });

    it('Can extend to "end" at file start', async () => {
        await editor.moveCursor(1, 3);

        await wordMoveSelects({select: true, boundary: 'end', value: -1}, 'fo');
    });

    after(async () => {
        await storeCoverageStats('simpleMotion');
    });
});
