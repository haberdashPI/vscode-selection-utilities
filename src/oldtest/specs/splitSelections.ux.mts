import '@wdio/globals';
import 'wdio-vscode-service';
import {cleanWhitespace, setupEditor, storeCoverageStats} from './utils.mts';
import {sleep, TextEditor} from 'wdio-vscode-service';

describe('Selection splitting', () => {
    let editor: TextEditor;

    async function setup() {
        editor = await setupEditor(`joe, boe, woe
            moe,b foe,c doe,d
            bill
            phill
        `);
        await browser.executeWorkbench(async vscode => {
            await vscode.commands.executeCommand('editor.action.selectAll');
        });
    }

    it('can split by string', async () => {
        await setup();
        await browser.executeWorkbench(async vscode => {
            await vscode.commands.executeCommand('selection-utilities.splitBy', {
                text: ',',
            });
        });
        await sleep(100);
        await browser.executeWorkbench(async vscode => {
            await vscode.commands.executeCommand('cursorRight');
        });
        await browser.keys('+');

        expect(await editor.getText()).toEqual(
            cleanWhitespace(`joe+, boe+, woe
                moe+,b foe+,c doe+,d
                bill
                phill
            +`)
        );
    });

    it('can split by newline', async () => {
        await setup();
        await browser.executeWorkbench(async vscode => {
            await vscode.commands.executeCommand('selection-utilities.splitByNewline');
        });
        await sleep(100);
        await browser.executeWorkbench(async vscode => {
            await vscode.commands.executeCommand('cursorRight');
        });

        await browser.keys('+');
        expect(await editor.getText()).toEqual(
            cleanWhitespace(`joe, boe, woe+
                moe,b foe,c doe,d+
                bill+
                phill+
            `)
        );
    });

    it('can split by regex', async () => {
        await setup();
        await browser.executeWorkbench(async vscode => {
            await vscode.commands.executeCommand('selection-utilities.splitByRegex', {
                text: ',[a-z]\\s*',
            });
        });
        await sleep(100);
        await browser.executeWorkbench(async vscode => {
            await vscode.commands.executeCommand('cursorRight');
        });

        await browser.keys('+');
        expect(await editor.getText()).toEqual(
            cleanWhitespace(`joe, boe, woe
                moe+,b foe+,c doe+,d
                bill
                phill
            +`)
        );
    });

    it('can create by string', async () => {
        await setup();
        await browser.executeWorkbench(async vscode => {
            await vscode.commands.executeCommand('selection-utilities.createBy', {
                text: 'oe',
            });
        });
        await sleep(100);
        await browser.executeWorkbench(async vscode => {
            await vscode.commands.executeCommand('cursorRight');
        });

        await browser.keys('+');
        expect(await editor.getText()).toEqual(
            cleanWhitespace(`joe+, boe+, woe+
                moe+,b foe+,c doe+,d
                bill
                phill
            `)
        );
    });

    it('can create by regex', async () => {
        await setup();
        await browser.executeWorkbench(async vscode => {
            await vscode.commands.executeCommand('selection-utilities.createByRegex', {
                text: '[a-z]\\s+',
            });
        });
        await sleep(100);
        await browser.executeWorkbench(async vscode => {
            await vscode.commands.executeCommand('cursorRight');
        });

        await browser.keys('+');
        expect(await editor.getText()).toEqual(
            cleanWhitespace(`joe, boe, woe
                moe,b +foe,c +doe,d
                bill
                phill
            `)
        );
    });

    after(async () => {
        await storeCoverageStats('filterSelections');
    });
});
