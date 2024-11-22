import '@wdio/globals';
import 'wdio-vscode-service';
import {cleanWhitespace, setupEditor, storeCoverageStats} from './utils.mts';
import {TextEditor} from 'wdio-vscode-service';

describe('Selection splitting', () => {
    let editor: TextEditor;

    async function setup() {
        editor = await setupEditor(`joe, boe, woe
            moe,b foe,c doe,d
            bill
            phill
        `);

        await editor.moveCursor(1, 1);
    }

    it('can split by string', async () => {
        await setup();
        await browser.executeWorkbench(async vscode => {
            await vscode.commands.executeCommand('selection-utilities.splitBy', {
                text: ',',
            });
        });

        await browser.keys('+');
        expect(await editor.getText()).toEqual(
            cleanWhitespace(`joe+, boe+, woe
                moe+,b foe+,c doe+,d
                bill
                phill+
            `)
        );
    });

    it('can split by newline', async () => {
        await setup();
        await browser.executeWorkbench(async vscode => {
            await vscode.commands.executeCommand('selection-utilities.splitByNewline');
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

        await browser.keys('+');
        expect(await editor.getText()).toEqual(
            cleanWhitespace(`joe, boe, woe
                moe+,b foe+,c doe+,d
                bill
                phill+
            `)
        );
    });

    it('can create by string', async () => {
        await setup();
        await browser.executeWorkbench(async vscode => {
            await vscode.commands.executeCommand('selection-utilities.createBy', {
                text: 'oe',
            });
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
                text: 'oe',
            });
        });

        await browser.keys('+');
        expect(await editor.getText()).toEqual(
            cleanWhitespace(`joe,+ boe,+ woe
                moe,+b foe,+c doe,+d
                bill
                phill
            `)
        );
    });

    after(async () => {
        await storeCoverageStats('filterSelections');
    });
});
