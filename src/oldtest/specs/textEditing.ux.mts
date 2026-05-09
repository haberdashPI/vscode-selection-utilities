import '@wdio/globals';
import 'wdio-vscode-service';
import {setupEditor, storeCoverageStats} from './utils.mts';
import {sleep, TextEditor} from 'wdio-vscode-service';

describe('Editing commands', () => {
    let editor: TextEditor;

    it('can trim whitespace', async () => {
        editor = await setupEditor('aa   bb');
        await editor.moveCursor(1, 1);
        await browser.executeWorkbench(async vscode => {
            await vscode.commands.executeCommand('selection-utilities.moveBy', {
                unit: 'word',
                value: 1,
                select: true,
                boundary: 'start',
            });
            await vscode.commands.executeCommand('selection-utilities.trimWhitespace');
        });
        expect(await editor.getText()).toEqual('aabb');
    });

    it('can align selections', async () => {
        // WANRING: WHITESPACE REALLY MATTERS HERE!! You can easily cause these
        // tests to fail by changing the indent level of this code
        /* eslint-disable */
        editor = await setupEditor(`
aaaaaaaa
  bbbbbb
    ccc
`,
            {cleanWhitespace: false}
        );
        /* eslint-enable */
        await browser.executeWorkbench(vscode => {
            vscode.commands.executeCommand('selection-utilities.cancelSelection');
        });

        await editor.moveCursor(1, 1);

        for (let i = 0; i < 3; i++) {
            await browser.executeWorkbench(async vscode => {
                await vscode.commands.executeCommand('editor.action.insertCursorBelow');
            });
            sleep(100);
        }
        await browser.executeWorkbench(async vscode => {
            await vscode.commands.executeCommand('selection-utilities.moveBy', {
                unit: 'word',
                value: 1,
                selectWhole: true,
                boundary: 'both',
            });
            await vscode.commands.executeCommand('selection-utilities.alignSelectionsLeft');
        });

        // WANRING: WHITESPACE REALLY MATTERS HERE!! You can easily cause these
        // tests to fail by changing the indent level of this code
        /* eslint-disable */
        expect(await editor.getText()).toEqual(`
    aaaaaaaa
    bbbbbb
    ccc
`);
        /* eslint-enable */
        await browser.executeWorkbench(vscode => {
            vscode.commands.executeCommand('selection-utilities.cancelSelection');
        });

        await editor.moveCursor(1, 1);

        for (let i = 0; i < 3; i++) {
            await browser.executeWorkbench(async vscode => {
                await vscode.commands.executeCommand('editor.action.insertCursorBelow');
            });
            sleep(100);
        }
        await browser.executeWorkbench(async vscode => {
            await vscode.commands.executeCommand('selection-utilities.moveBy', {
                unit: 'word',
                value: 1,
                selectWhole: true,
                boundary: 'both',
            });
            await vscode.commands.executeCommand('selection-utilities.alignSelectionsLeft');
        });
        await browser.executeWorkbench(async vscode => {
            await vscode.commands.executeCommand(
                'selection-utilities.alignSelectionsRight'
            );
        });

        // WANRING: WHITESPACE REALLY MATTERS HERE!! You can easily cause these
        // tests to fail by changing the indent level of this code
        /* eslint-disable */
        expect(await editor.getText()).toEqual(`
    aaaaaaaa
      bbbbbb
         ccc
`);
        /* eslint-enable */
    });

    it('can insert or delete around selections', async () => {
        editor = await setupEditor('foo bar');
        await editor.moveCursor(1, 1);
        await browser.executeWorkbench(async vscode => {
            await vscode.commands.executeCommand('selection-utilities.moveBy', {
                unit: 'word',
                value: 1,
                select: true,
                boundary: 'end',
            });
            await vscode.commands.executeCommand('selection-utilities.insertAround', {
                before: '(',
                after: ')',
            });
        });
        expect(await editor.getText()).toEqual('(foo) bar');

        await editor.moveCursor(1, 2);
        await browser.executeWorkbench(async vscode => {
            await vscode.commands.executeCommand('selection-utilities.moveBy', {
                unit: 'word',
                value: 1,
                select: true,
                boundary: 'end',
            });
            await vscode.commands.executeCommand('selection-utilities.deleteAround');
        });
        expect(await editor.getText()).toEqual('foo bar');
    });

    after(async () => {
        await storeCoverageStats('textEditing');
    });
});
