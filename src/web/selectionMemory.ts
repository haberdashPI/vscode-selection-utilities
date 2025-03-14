import * as vscode from 'vscode';
import {IHash, compareSels} from './util';
import {cloneDeep} from 'lodash';

let activeSelectDecorator: vscode.TextEditorDecorationType;
let savedSelectDecorator: vscode.TextEditorDecorationType;
let primarySelectionIndex = 0;

function getPrimarySelectionIndex(editor: vscode.TextEditor) {
    if (primarySelectionIndex >= editor.selections.length) {
        primarySelectionIndex = editor.selections.length - 1;
    }
    return primarySelectionIndex;
}

export function getPrimarySelection(editor: vscode.TextEditor) {
    return editor.selections[getPrimarySelectionIndex(editor)];
}

export function updateView(editor: vscode.TextEditor) {
    const pos = getPrimarySelection(editor).active;
    editor.revealRange(new vscode.Range(pos, pos));
}

function updateActiveSelection(
    editor: vscode.TextEditor,
    sel: ReadonlyArray<vscode.Selection>
) {
    if (sel.length > 1) {
        const prim = getPrimarySelection(editor);
        editor.setDecorations(activeSelectDecorator, [
            new vscode.Range(prim.start, prim.end),
        ]);
    } else {
        editor.setDecorations(activeSelectDecorator, []);
    }
}

function updateSavedSelection(editor: vscode.TextEditor) {
    const mainSave = selectionRegisters['default'];
    if (mainSave && mainSave.length > 0) {
        editor.setDecorations(
            savedSelectDecorator,
            mainSave.map(x => new vscode.Range(x.start, x.end))
        );
    } else {
        editor.setDecorations(savedSelectDecorator, []);
    }
}

const selectionRegisters: IHash<vscode.Selection[]> = {};

interface SelectMemoryArgs {
    register?: string;
}

function getSelectMemory(args: SelectMemoryArgs, order: boolean = true) {
    let register = 'default';
    if (args?.register !== undefined) {
        register = args.register;
    }

    let memory: vscode.Selection[] = [];
    if (selectionRegisters[register] !== undefined) {
        memory = selectionRegisters[register];
    }

    return order ? memory.sort(compareSels) : memory;
}

function saveSelectMemory(
    sels: readonly vscode.Selection[],
    args: SelectMemoryArgs,
    editor: vscode.TextEditor
) {
    let register = 'default';
    if (args?.register !== undefined) {
        register = args.register;
    }

    selectionRegisters[register] = <vscode.Selection[]>cloneDeep(sels);
    updateSavedSelection(editor);
}

function curSelectionOrWord(editor: vscode.TextEditor) {
    if (editor.selections.length === 1 && editor.selection.isEmpty) {
        const range = editor.document.getWordRangeAtPosition(editor.selection.start);
        if (range !== undefined) {
            return [new vscode.Selection(range.start, range.end)];
        }
    }
    return editor.selections;
}

export function updateDecorators(event?: vscode.ConfigurationChangeEvent) {
    if (!event || event.affectsConfiguration('selection-utilities')) {
        const config = vscode.workspace.getConfiguration('selection-utilities');
        const primarySelectionColor = config.get<string>('primarySelectionColor');
        const savedSelectionColor = config.get<string>('savedSelectionColor');

        activeSelectDecorator = vscode.window.createTextEditorDecorationType({
            backgroundColor: primarySelectionColor,
        });

        savedSelectDecorator = vscode.window.createTextEditorDecorationType({
            backgroundColor: savedSelectionColor,
        });
    }
}

export function registerSelectionMemoryCommands(context: vscode.ExtensionContext) {
    vscode.window.onDidChangeTextEditorSelection(e =>
        updateActiveSelection(e.textEditor, e.selections)
    );

    /**
     * @section Multiselection Primitives
     * @sectionBody These commands modify the number of selections, usually in reference to
     * the primary selection, which is colored differently than the other selections. Focus
     * is generally moved with this primary selection.
     * @order -5
     * @command movePrimaryLeft
     *
     * Moves the primary selection the next selection to the left and downwards.
     */
    context.subscriptions.push(
        vscode.commands.registerCommand(
            'selection-utilities.movePrimaryLeft',
            movePrimaryLeft
        )
    );
    /**
     * @order -5
     * @command movePrimaryRight
     *
     * Moves the primary selection the next selection to the right and upwards.
     */
    context.subscriptions.push(
        vscode.commands.registerCommand(
            'selection-utilities.movePrimaryRight',
            movePrimaryRight
        )
    );

    /**
     * @order -5
     * @command focusPrimarySelection
     *
     * Focuses the view on the primary selection if it is not already focused.
     */
    context.subscriptions.push(
        vscode.commands.registerCommand(
            'selection-utilities.focusPrimarySelection',
            focusPrimarySelection
        )
    );

    /**
     * @order -5
     * @command appendToMemory
     *
     * Saves the current selections to a memory. If existing selections have already been
     * saved, the new selections are appended to the old. If the default register is used,
     * the save selections are highlighted in green. Once stored in memory the selections
     * are cleared from the editor. Selections can be restored using
     * [restoreAndClear](/commands/restoreAndClear).
     *
     * ## Arguments
     * - `register` (default="default") - The register to save the selections to. A
     *   register is a distinct memory bank where selections can be stored.
     */
    context.subscriptions.push(
        vscode.commands.registerCommand(
            'selection-utilities.appendToMemory',
            appendToMemory
        )
    );

    /**
     * @order -5
     * @command restoreAndClear
     *
     * Restores the saved selections, then clears the saved selections from memory.
     *
     * ## Arguments
     * - `register` (default="default") - The register to restore selections from.
     */
    context.subscriptions.push(
        vscode.commands.registerCommand(
            'selection-utilities.restoreAndClear',
            restoreAndClear
        )
    );
    context.subscriptions.push(
        vscode.commands.registerCommand('selection-utilities.clearMemory', clearMemory)
    );

    /**
     * @order -5
     * @command swapWithMemory
     *
     * If no selections have been saved, the current selections are saved to the memory. If
     * selections have been saved, the content of the current selections in the editor are
     * swapped with the content of the saved selections in the editor.
     *
     * ## Arguments
     * - `register` (default="default") - The register to save the selections to.
     */
    context.subscriptions.push(
        vscode.commands.registerCommand(
            'selection-utilities.swapWithMemory',
            swapWithMemory
        )
    );

    /**
     * @order -5
     * @command cancelSelection
     *
     * Clears the current selections from the editor, saving the old selections to the
     * 'cancel' register.
     */
    context.subscriptions.push(
        vscode.commands.registerCommand(
            'selection-utilities.cancelSelection',
            cancelSelection
        )
    );

    /**
     * @order -5
     * @command deleteLastSaved
     *
     * Remove the most recently saved set of selections from memory.
     *
     * ## Arguments
     * - `register` (default="default") - The register to save the selections to.
     */
    context.subscriptions.push(
        vscode.commands.registerCommand(
            'selection-utilities.deleteLastSaved',
            deleteLastSaved
        )
    );

    /**
     * @order -5
     * @command deletePrimary
     *
     * Clears the primary selection, making the previously added selection, if it exists,
     * the primary selection.
     */
    context.subscriptions.push(
        vscode.commands.registerCommand('selection-utilities.deletePrimary', deletePrimary)
    );

    /**
     * @order -5
     * @command addNext
     *
     * Adds the next match of the current selection as a selection, making it the primary
     * selection.
     */
    context.subscriptions.push(
        vscode.commands.registerCommand('selection-utilities.addNext', addNext)
    );

    /**
     * @order -5
     * @command skipNext
     *
     * Adds the next match of the current selection as a selection, removes the current
     * selection, and makes the just added selection the primary selection.
     */
    context.subscriptions.push(
        vscode.commands.registerCommand('selection-utilities.skipNext', skipNext)
    );

    /**
     * @order -5
     * @command addPrev
     *
     * Adds the previous match of the current selection as a selection, making it the
     * primary selection..
     */
    context.subscriptions.push(
        vscode.commands.registerCommand('selection-utilities.addPrev', () => addNext(false))
    );

    /**
     * @order -5
     * @command skipPrev
     *
     * Adds the previous match of the current selection as a selection, removes the current
     * selection, and makes the just added selection the primary selection.
     */
    context.subscriptions.push(
        vscode.commands.registerCommand('selection-utilities.skipPrev', () =>
            skipNext(false)
        )
    );
}

function movePrimaryLeft() {
    const editor = vscode.window.activeTextEditor;
    if (editor) {
        primarySelectionIndex--;
        if (primarySelectionIndex < 0) {
            primarySelectionIndex = Math.max(0, editor.selections.length - 1);
        }

        updateView(editor);
        updateActiveSelection(editor, editor.selections);
    }
}

function movePrimaryRight() {
    const editor = vscode.window.activeTextEditor;
    if (editor) {
        primarySelectionIndex++;
        if (primarySelectionIndex >= editor.selections.length) {
            primarySelectionIndex = 0;
        }

        updateView(editor);
        updateActiveSelection(editor, editor.selections);
    }
}

function focusPrimarySelection() {
    const editor = vscode.window.activeTextEditor;
    if (editor) {
        updateView(editor);
    }
}

function appendToMemory(args: SelectMemoryArgs) {
    const editor = vscode.window.activeTextEditor;
    if (editor) {
        let memory = getSelectMemory(args);
        memory = memory.concat(curSelectionOrWord(editor));
        saveSelectMemory(memory, args, editor);

        editor.selection = getPrimarySelection(editor);
    }
}

function restoreAndClear(args: SelectMemoryArgs) {
    const editor = vscode.window.activeTextEditor;
    if (editor) {
        const memory = getSelectMemory(args);
        if (memory !== undefined && memory.length > 0) {
            const prim = getPrimarySelection(editor);
            primarySelectionIndex = findClosestIndex(memory, prim);
            editor.selections = memory;
            updateView(editor);
            saveSelectMemory([], args, editor);
        }
    }
}

function clearMemory(args: SelectMemoryArgs) {
    const editor = vscode.window.activeTextEditor;
    if (editor) {
        const memory = getSelectMemory(args);
        if (memory !== undefined && memory.length > 0) {
            saveSelectMemory([], args, editor);
        }
    }
}

function findClosestIndex(sels: vscode.Selection[], x: vscode.Selection) {
    const sameLineIndices = sels
        .map((y, i) => (y.active.line === x.active.line ? i : -1))
        .filter(x => x > 0);
    if (sameLineIndices.length === 0) {
        let mindist = Number.MAX_VALUE;
        let index = 0;

        for (let i = 0; i < sels.length; i++) {
            const dist = Math.abs(sels[i].active.line - x.active.line);
            if (mindist > dist) {
                mindist = dist;
                index = i;
            }
        }
        return index;
    } else {
        let mindist = Number.MAX_VALUE;
        let index = 0;

        for (const i of sameLineIndices) {
            const dist = Math.abs(sels[i].active.character - x.active.character);
            if (mindist > dist) {
                mindist = dist;
                index = i;
            }
        }
        return index;
    }
}

function swapWithMemoryFn(
    editor: vscode.TextEditor,
    current: readonly vscode.Selection[],
    old: vscode.Selection[]
) {
    const curText = current.map(sel =>
        editor.document.getText(new vscode.Range(sel.start, sel.end))
    );
    const oldText = old.map(sel =>
        editor.document.getText(new vscode.Range(sel.start, sel.end))
    );
    return (edit: vscode.TextEditorEdit) => {
        current.forEach((sel, i) => {
            edit.replace(sel, oldText[i]);
        });
        old.forEach((sel, i) => {
            edit.replace(sel, curText[i]);
        });
    };
}

function swapWithMemory(args: SelectMemoryArgs) {
    const editor = vscode.window.activeTextEditor;
    if (editor) {
        const memory = getSelectMemory(args);
        if (memory.length === 0) {
            saveSelectMemory(curSelectionOrWord(editor), args, editor);
        } else if (memory.length !== editor.selections.length) {
            vscode.window.showErrorMessage(
                'Number of saved ' +
                    'selections must match the current number of ' +
                    'selections.'
            );
        } else {
            editor.edit(swapWithMemoryFn(editor, editor.selections, memory));
            saveSelectMemory([], args, editor);
        }
    }
}

function cancelSelection() {
    const editor = vscode.window.activeTextEditor;
    if (editor && editor.selections.length > 0) {
        const pos = getPrimarySelection(editor).active;
        saveSelectMemory(editor.selections, {register: 'cancel'}, editor);
        editor.selection = new vscode.Selection(pos, pos);
    }
}

function deleteLastSaved(args: SelectMemoryArgs) {
    const editor = vscode.window.activeTextEditor;
    if (editor) {
        const memory = getSelectMemory(args, false);
        memory.pop();
        saveSelectMemory(memory, args, editor);
    }
}

function deletePrimary() {
    const editor = vscode.window.activeTextEditor;
    if (editor && editor.selections.length > 1) {
        if (editor.selections.length > 1) {
            const sels = <vscode.Selection[]>cloneDeep(editor.selections);
            const prim = getPrimarySelectionIndex(editor);
            sels.splice(prim, 1);
            editor.selections = sels;
        } else {
            const pos = editor.selection.active;
            editor.selection = new vscode.Selection(pos, pos);
        }
        updateView(editor);
    }
}

async function addNext(next: boolean = true) {
    const editor = vscode.window.activeTextEditor;
    if (editor) {
        const sel = curSelectionOrWord(editor);

        if (editor.selection.isEmpty) {
            editor.selection = sel[0];
        } else {
            const sels = <vscode.Selection[]>cloneDeep(editor.selections);
            editor.selection = getPrimarySelection(editor);
            if (next) {
                await vscode.commands.executeCommand(
                    'editor.action.addSelectionToNextFindMatch'
                );
            } else {
                await vscode.commands.executeCommand(
                    'editor.action.addSelectionToPreviousFindMatch'
                );
            }

            if (editor.selections.length > 1) {
                const addme = editor.selections[1];
                sels.push(addme);
                sels.sort(compareSels);
                primarySelectionIndex = sels.findIndex(x => x.isEqual(addme));
            }
            editor.selections = sels;
            updateView(editor);
            updateActiveSelection(editor, sels);
        }
    }
}

async function skipNext(next: boolean = true) {
    const editor = vscode.window.activeTextEditor;
    if (editor) {
        if (editor.selections.length <= 1) {
            if (next) {
                await vscode.commands.executeCommand(
                    'editor.action.moveSelectionToNextFindMatch'
                );
            } else {
                await vscode.commands.executeCommand(
                    'editor.action.moveSelectionToPreviousFindMatch'
                );
            }
        } else {
            const sels = <vscode.Selection[]>cloneDeep(editor.selections);
            const oldPrimary = getPrimarySelectionIndex(editor);
            editor.selection = editor.selections[oldPrimary];
            if (next) {
                await vscode.commands.executeCommand(
                    'editor.action.addSelectionToNextFindMatch'
                );
            } else {
                await vscode.commands.executeCommand(
                    'editor.action.addSelectionToPreviousFindMatch'
                );
            }
            if (editor.selections.length >= 1) {
                const addme = editor.selections[1];
                sels.splice(oldPrimary, 1, addme);
                sels.push(addme);
                sels.sort(compareSels);
                primarySelectionIndex = sels.findIndex(x => x.isEqual(addme));
            }
            editor.selections = sels;
            updateView(editor);
        }
    }
}
