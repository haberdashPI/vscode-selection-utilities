// start with just some basic tests to verify all is well

import '@wdio/globals';
import 'wdio-vscode-service';
import {setupEditor, storeCoverageStats, waitUntilCursorUnmoving} from './utils.mts';
import {TextEditor, Workbench} from 'wdio-vscode-service';

describe('Simple Motions', () => {
    let editor: TextEditor;
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    let workbench: Workbench;
    before(async () => {
        editor = await setupEditor('foo bar biz baz');
        workbench = await browser.getWorkbench();
    });

    it('Can move by word', async () => {
        await editor.moveCursor(1, 1);

        await browser.executeWorkbench(vscode => {
            vscode.commands.executeCommand('selection-utilities.moveBy', {
                unit: 'word',
                selectWhole: true,
                value: 1,
                boundary: 'both',
            });
        });
        const [y, x] = await editor.getCoordinates();
        await waitUntilCursorUnmoving(editor, {y, x});
        expect(await editor.getSelectedText()).toEqual('foo');
    });

    after(async () => {
        await storeCoverageStats('simpleMotion');
    });
});
