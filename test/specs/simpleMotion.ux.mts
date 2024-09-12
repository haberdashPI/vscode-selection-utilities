// start with just some basic tests to verify all is well

import '@wdio/globals';
import 'wdio-vscode-service';
import {setupEditor, storeCoverageStats} from './utils.mts';
import {TextEditor, Workbench} from 'wdio-vscode-service';

describe('Simple Motions', () => {
    let editor: TextEditor;
    let workbench: Workbench;
    before(async () => {
        editor = await setupEditor(`foo bar biz baz`);
        workbench = await browser.getWorkbench();
    });

    it('should be able to load VSCode', async () => {
        const workbench = await browser.getWorkbench()
        expect(await workbench.getTitleBar().getTitle())
            .toContain('[Extension Development Host]')
    })

    it('Can move by word', async () => {
        await editor.moveCursor(1, 1);

        await browser.executeWorkbench(vscode => {
            vscode.commands.executeCommand('selection-utilities.moveBy', {
                unit: 'word',
                selectWhole: true,
                value: 1,
                boundary: 'both'
            })
        });
        expect(await editor.getText()).toEqual('foo');
    });

    after(async () => {
        await storeCoverageStats('simpleMotion');
    });
});
