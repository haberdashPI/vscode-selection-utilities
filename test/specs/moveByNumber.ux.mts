// start with just some basic tests to verify all is well

import '@wdio/globals';
import 'wdio-vscode-service';
import {setupEditor, storeCoverageStats, waitUntilCursorUnmoving} from './utils.mts';
import {TextEditor} from 'wdio-vscode-service';

describe('Number Motion', () => {
    let editor: TextEditor;
    before(async () => {
        editor = await setupEditor('foo bar biz 123 biz bar foo');
    });

    it('Can move by start+end away from number', async () => {
        await editor.moveCursor(1, 1);
        await browser.executeWorkbench(vscode => {
            vscode.commands.executeCommand('selection-utilities.moveBy', {
                unit: 'number',
                value: 1,
                selectWhole: true,
                boundary: 'both',
            });
        });
        await waitUntilCursorUnmoving(editor);
        expect(await editor.getSelectedText()).toEqual('123');
    });

    after(async () => {
        await storeCoverageStats('numberMotion');
    });
});
