import '@wdio/globals';
import 'wdio-vscode-service';
import {cleanWhitespace, setupEditor, storeCoverageStats} from './utils.mts';
import {sleep, TextEditor} from 'wdio-vscode-service';

describe('Selection filtering', () => {
    let editor: TextEditor;

    async function setupCursors() {
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

        await browser.executeWorkbench(vscode => {
            vscode.commands.executeCommand('selection-utilities.moveBy', {
                unit: 'word',
                value: 1,
                boundary: 'both',
                selectWhole: true,
            });
        });
    }

    async function setup() {
        editor = await setupEditor(`joe
            moe
            bill
            phill
        `);

        await setupCursors();
        await sleep(100);
    }

    it('can filter by inclusion', async () => {
        await setup();
        await browser.executeWorkbench(async vscode => {
            await vscode.commands.executeCommand('selection-utilities.includeBy', {
                text: 'oe',
            });
            await vscode.commands.executeCommand('deleteRight');
        });

        expect(await editor.getText()).toEqual(
            cleanWhitespace(`

                bill
                phill
            `)
        );
    });

    it('can filter by exclusion', async () => {
        await setup();
        await setup();
        await browser.executeWorkbench(async vscode => {
            await vscode.commands.executeCommand('selection-utilities.excludeBy', {
                text: 'oe',
            });
            await vscode.commands.executeCommand('deleteRight');
        });

        expect(await editor.getText()).toEqual(
            cleanWhitespace(`joe
                moe


            `)
        );
    });

    it('can filter by regex inclusion', async () => {
        await setup();
        await browser.executeWorkbench(async vscode => {
            await vscode.commands.executeCommand('selection-utilities.includeByRegex', {
                text: '^[jb]',
            });
            await vscode.commands.executeCommand('deleteRight');
        });

        expect(await editor.getText()).toEqual(
            cleanWhitespace(`
                moe

                phill
            `)
        );
    });

    it('can filter by regex exclusion', async () => {
        await setup();
        await browser.executeWorkbench(async vscode => {
            await vscode.commands.executeCommand('selection-utilities.excludeByRegex', {
                text: '^[jb]',
            });
            await vscode.commands.executeCommand('deleteRight');
        });

        expect(await editor.getText()).toEqual(
            cleanWhitespace(`joe

                bill

            `)
        );
    });

    after(async () => {
        await storeCoverageStats('filterSelections');
    });
});
