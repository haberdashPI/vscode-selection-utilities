import '@wdio/globals';
import 'wdio-vscode-service';
import {cleanWhitespace, setupEditor, storeCoverageStats} from './utils.mts';
import {sleep, TextEditor} from 'wdio-vscode-service';

describe('Number changes', () => {
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

    before(async () => {
        editor = await setupEditor(`1
            1
            1
            1
        `);

        await setupCursors();
    });

    it('can increment numbers', async () => {
        await browser.executeWorkbench(async vscode => {
            await vscode.commands.executeCommand('selection-utilities.incrementNumber');
        });
        await sleep(100);
        expect(await editor.getText()).toEqual(
            cleanWhitespace(`2
                2
                2
                2
            `)
        );
    });

    it('can decrement numbers', async () => {
        await setupCursors();
        await browser.executeWorkbench(async vscode => {
            await vscode.commands.executeCommand('selection-utilities.decrementNumber');
        });
        await sleep(100);
        expect(await editor.getText()).toEqual(
            cleanWhitespace(`1
                1
                1
                1
            `)
        );
    });

    it('can increment numbers per selection', async () => {
        await setupCursors();
        await browser.executeWorkbench(async vscode => {
            await vscode.commands.executeCommand(
                'selection-utilities.incrementNumberPerSelection'
            );
        });
        expect(await editor.getText()).toEqual(
            cleanWhitespace(`1
                2
                3
                4
            `)
        );
    });

    it('can decrement numbers per selection', async () => {
        await setupCursors();
        await browser.executeWorkbench(async vscode => {
            await vscode.commands.executeCommand(
                'selection-utilities.decrementNumberPerSelection'
            );
        });
        expect(await editor.getText()).toEqual(
            cleanWhitespace(`1
                1
                1
                1
            `)
        );
    });

    it('errors with bad selection', async () => {
        editor = await setupEditor('a\n');
        await browser.executeWorkbench(async vscode => {
            await vscode.commands.executeCommand('selection-utilities.moveBy', {
                unit: 'word',
                value: 1,
                boundary: 'both',
                selectWhole: true,
            });
        });

        await browser.executeWorkbench(async vscode => {
            await vscode.commands.executeCommand('selection-utilities.incrementNumber');
        });

        const workbench = await browser.getWorkbench();
        const notifs = await Promise.all(
            (await workbench.getNotifications()).map(n => n.getMessage())
        );
        expect(notifs).toContain("The selected text 'a' is not a number.");
    });

    after(async () => {
        await storeCoverageStats('changeNumbers');
    });
});
