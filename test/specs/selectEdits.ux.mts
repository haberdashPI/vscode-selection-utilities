import '@wdio/globals';
import 'wdio-vscode-service';
import {setupEditor, storeCoverageStats} from './utils.mts';
import {sleep, TextEditor} from 'wdio-vscode-service';

const startText = 'foo bar biz foo biz bar foo biz foo';
describe('Selection edits', () => {
    let editor: TextEditor;
    before(async () => {
        editor = await setupEditor(startText);
    });

    it('can add by match', async () => {
        await editor.moveCursor(1, 1);

        await browser.executeWorkbench(async vscode => {
            await vscode.commands.executeCommand('selection-utilities.moveBy', {
                unit: 'word',
                value: 1,
                select: true,
                boundary: 'both',
            });

            await vscode.commands.executeCommand('selection-utilities.addNext');
            await vscode.commands.executeCommand('deleteRight');
        });

        expect(await editor.getText()).toEqual(' bar biz  biz bar foo biz foo');
    });

    it('can cancel selections', async () => {
        await editor.setText(startText);
        await editor.moveCursor(1, 1);

        await browser.executeWorkbench(async vscode => {
            await vscode.commands.executeCommand('selection-utilities.moveBy', {
                unit: 'word',
                value: 1,
                select: true,
                boundary: 'both',
            });

            await vscode.commands.executeCommand('selection-utilities.addNext');
            await vscode.commands.executeCommand('selection-utilities.cancelSelection');
            await vscode.commands.executeCommand('deleteRight');
        });

        expect(await editor.getText()).toEqual('foo bar biz foobiz bar foo biz foo');

        await browser.executeWorkbench(async vscode => {
            await vscode.commands.executeCommand('selection-utilities.restoreAndClear', {
                register: 'cancel',
            });
            await vscode.commands.executeCommand('deleteRight');
        });

        expect(await editor.getText()).toEqual(' bar biz biz bar foo biz foo');
    });

    it('can skip by match', async () => {
        await editor.setText(startText);
        await editor.moveCursor(1, 1);

        await browser.executeWorkbench(async vscode => {
            await vscode.commands.executeCommand('selection-utilities.moveBy', {
                unit: 'word',
                value: 1,
                select: true,
                boundary: 'both',
            });

            await vscode.commands.executeCommand('selection-utilities.addNext');
            await vscode.commands.executeCommand('selection-utilities.skipNext');
            await vscode.commands.executeCommand('deleteRight');
        });

        expect(await editor.getText()).toEqual(' bar biz foo biz bar  biz foo');
    });

    it('can add prev by match', async () => {
        await editor.setText(startText);
        await editor.moveCursor(1, 1);

        await browser.executeWorkbench(async vscode => {
            await vscode.commands.executeCommand('selection-utilities.moveBy', {
                unit: 'word',
                value: 1,
                select: true,
                boundary: 'both',
            });

            await vscode.commands.executeCommand('selection-utilities.addPrev');
            await vscode.commands.executeCommand('deleteRight');
        });

        expect(await editor.getText()).toEqual(' bar biz foo biz bar foo biz ');
    });

    it('can skip prev by match', async () => {
        await editor.setText(startText);
        await editor.moveCursor(1, 1);

        await browser.executeWorkbench(async vscode => {
            await vscode.commands.executeCommand('selection-utilities.moveBy', {
                unit: 'word',
                value: 1,
                select: true,
                boundary: 'both',
            });

            await vscode.commands.executeCommand('selection-utilities.addPrev');
            await vscode.commands.executeCommand('selection-utilities.skipPrev');
            await vscode.commands.executeCommand('deleteRight');
        });

        expect(await editor.getText()).toEqual(' bar biz foo biz bar  biz foo');
    });

    it('can move and delete primary selection', async () => {
        await editor.setText(startText);
        await editor.moveCursor(1, 1);

        await browser.executeWorkbench(async vscode => {
            await vscode.commands.executeCommand('editor.action.selectHighlights');
            await vscode.commands.executeCommand('selection-utilities.movePrimaryRight');
            await vscode.commands.executeCommand('selection-utilities.movePrimaryRight');
            await vscode.commands.executeCommand('selection-utilities.movePrimaryLeft');
            await vscode.commands.executeCommand('selection-utilities.deletePrimary');
            await vscode.commands.executeCommand('deleteRight');
        });

        expect(await editor.getText()).toEqual(' bar biz  biz bar foo biz ');
    });

    it('can save and restore selections', async () => {
        await editor.setText(startText);
        await editor.moveCursor(1, 1);

        await browser.executeWorkbench(async vscode => {
            await vscode.commands.executeCommand('selection-utilities.moveBy', {
                unit: 'word',
                value: 1,
                selectWhole: true,
                boundary: 'both',
            });
            await vscode.commands.executeCommand('selection-utilities.appendToMemory');
            await vscode.commands.executeCommand('selection-utilities.moveBy', {
                unit: 'word',
                value: 1,
                selectWhole: true,
                boundary: 'both',
            });
            await vscode.commands.executeCommand('selection-utilities.appendToMemory');
            await vscode.commands.executeCommand('selection-utilities.moveBy', {
                unit: 'word',
                value: 1,
                selectWhole: true,
                boundary: 'both',
            });
            await vscode.commands.executeCommand('selection-utilities.appendToMemory');
            await vscode.commands.executeCommand('selection-utilities.moveBy', {
                unit: 'word',
                value: 1,
                selectWhole: true,
                boundary: 'both',
            });
            await vscode.commands.executeCommand('selection-utilities.deleteLastSaved');
            await vscode.commands.executeCommand('selection-utilities.restoreAndClear');
            await vscode.commands.executeCommand('deleteRight');
        });

        expect(await editor.getText()).toEqual('  biz foo biz bar foo biz foo');
    });

    it('can clear selection memory', async () => {
        await editor.setText(startText);
        await editor.moveCursor(1, 1);

        await browser.executeWorkbench(async vscode => {
            await vscode.commands.executeCommand('selection-utilities.moveBy', {
                unit: 'word',
                value: 1,
                selectWhole: true,
                boundary: 'both',
            });
            await vscode.commands.executeCommand('selection-utilities.appendToMemory');
            await vscode.commands.executeCommand('selection-utilities.moveBy', {
                unit: 'word',
                value: 1,
                selectWhole: true,
                boundary: 'both',
            });
            await vscode.commands.executeCommand('selection-utilities.appendToMemory');
        });
        await sleep(100);

        await browser.executeWorkbench(async vscode => {
            await vscode.commands.executeCommand('selection-utilities.clearMemory');
            await vscode.commands.executeCommand('selection-utilities.cancelSelection');
            await vscode.commands.executeCommand('selection-utilities.restoreAndClear');
            await vscode.commands.executeCommand('deleteLeft');
        });

        expect(await editor.getText()).toEqual('foo ba biz foo biz bar foo biz foo');
    });

    it('can swap regions', async () => {
        await editor.setText(startText);
        await editor.moveCursor(1, 1);

        await browser.executeWorkbench(async vscode => {
            await vscode.commands.executeCommand('selection-utilities.moveBy', {
                unit: 'word',
                value: 1,
                selectWhole: true,
                boundary: 'both',
            });
            await vscode.commands.executeCommand('selection-utilities.swapWithMemory');

            await vscode.commands.executeCommand('selection-utilities.moveBy', {
                unit: 'word',
                value: 1,
                selectWhole: true,
                boundary: 'both',
            });
            await vscode.commands.executeCommand('selection-utilities.swapWithMemory');
        });

        expect(await editor.getText()).toEqual('bar foo biz foo biz bar foo biz foo');
    });

    it('can move symmetrically', async () => {
        await editor.setText(startText);
        await editor.moveCursor(1, 1);
        await sleep(100);

        await browser.executeWorkbench(async vscode => {
            await vscode.commands.executeCommand('selection-utilities.moveBy', {
                unit: 'word',
                value: 1,
                selectWhole: true,
                boundary: 'both',
            });
            await vscode.commands.executeCommand('selection-utilities.moveBy', {
                unit: 'word',
                value: 1,
                selectWhole: true,
                boundary: 'both',
            });
            await vscode.commands.executeCommand('selection-utilities.adjustSelections', {
                dir: 'inward',
                count: 1,
            });
        });

        expect(await editor.getSelectedText()).toEqual('a');

        await browser.executeWorkbench(async vscode => {
            await vscode.commands.executeCommand('selection-utilities.adjustSelections', {
                dir: 'outward',
                count: 2,
            });
        });

        expect(await editor.getSelectedText()).toEqual(' bar ');
    });

    it('can trim whitespace', async () => {
        await editor.setText(startText);
        await editor.moveCursor(1, 1);

        await browser.executeWorkbench(async vscode => {
            await vscode.commands.executeCommand('selection-utilities.moveBy', {
                unit: 'word',
                value: 1,
                selectWhole: true,
                boundary: 'both',
            });
            await vscode.commands.executeCommand('selection-utilities.moveBy', {
                unit: 'word',
                value: 1,
                selectWhole: true,
                boundary: 'both',
            });
            await vscode.commands.executeCommand('selection-utilities.adjustSelections', {
                dir: 'outward',
                count: 1,
            });
            await vscode.commands.executeCommand(
                'selection-utilities.trimSelectionWhitespace'
            );
        });

        expect(await editor.getSelectedText()).toEqual('bar');
    });

    after(async () => {
        await storeCoverageStats('selectEdits');
    });
});
