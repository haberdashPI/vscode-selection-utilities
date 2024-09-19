import '@wdio/globals';
import 'wdio-vscode-service';
import {setupEditor, storeCoverageStats, waitUntilCursorUnmoving} from './utils.mts';
import {TextEditor} from 'wdio-vscode-service';
import { moveCursor } from 'readline';

describe('Number changes', () => {
    let editor: TextEditor;

    async function setupCursors() {
        await browser.executeWorkbench(vscode => {
            vscode.commands.executeCommand('selection-utilities.cancelSelection');
        });

        await editor.moveCursor(1, 1);

        for (let i = 0; i < 4; i++) {
            await browser.executeWorkbench(vscode => {
                vscode.commands.executeCommand('editor.action.insertCursorBelow');
            });
        }

        // TODO: select next word here...
    }
    before(async () => {
        editor = await setupEditor(`
            1
            1
            1
            1
        `);

        await setupCursors();
    });

    it('can increment numbers', async () => {
        await browser.executeWorkbench(vscode => {
            vscode.commands.executeCommand('selection-utilities.incrementNumber');
        });
        expect(await editor.getText()).toEqual(`
            2
            2
            2
            2
        `);
    });

    it('can decrement numbers', async () => {
        await browser.executeWorkbench(vscode => {
            vscode.commands.executeCommand('selection-utilities.decrementNumber');
        });
        expect(await editor.getText()).toEqual(`
            1
            1
            1
            1
        `);
    });

    it('can increment numbers per selection', async () => {
        await browser.executeWorkbench(vscode => {
            vscode.commands.executeCommand(
                'selection-utilities.incrementNumberPerSelection'
            );
        });
        expect(await editor.getText()).toEqual(`
            1
            2
            3
            4
        `);
    });

    it('can decrement numbers per selection', async () => {
        await browser.executeWorkbench(vscode => {
            vscode.commands.executeCommand(
                'selection-utilities.decrementNumberPerSelection'
            );
        });
        expect(await editor.getText()).toEqual(`
            1
            1
            1
            1
        `);
    });

    it('errors with bad selection', async () => {
        editor = await setupEditor('a\n');
        // select word here
        await browser.executeWorkbench(vscode => {
            vscode.commands.executeCommand('selection-utilities.incrementNumber');
        });

        // check notification errors
    });

    after(async () => {
        await storeCoverageStats('changeNumbers');
    });
});
