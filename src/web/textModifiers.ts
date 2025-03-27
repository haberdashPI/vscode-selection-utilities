import * as vscode from 'vscode';

interface NumberUpdateArgs {
    by?: number;
    stepEachSelection?: boolean;
}

function changeNumberHelper(text: string, index: number, args: NumberUpdateArgs) {
    let number = parseInt(text);
    const step = args.by || 1;
    if (args.stepEachSelection) {
        number += step * index;
    } else {
        number += step;
    }
    return number.toString();
}

function changeNumber(args: NumberUpdateArgs) {
    const editor = vscode.window.activeTextEditor;
    if (editor) {
        const selTexts = editor.selections.map(s => editor.document.getText(s));
        const badTexts = selTexts.filter(s => !/[0-9]/.test(s));
        if (badTexts.length > 0) {
            vscode.window.showErrorMessage(
                `The selected text '${badTexts[0]}' is not a number.`
            );
            return;
        }

        editor.edit(edit => {
            for (let i = 0; i < editor.selections.length; i++) {
                edit.replace(
                    editor.selections[i],
                    changeNumberHelper(selTexts[i], i, args)
                );
            }
            return edit;
        });
    }
}

export function registerTextModifiers(context: vscode.ExtensionContext) {
    /**
     * @section Number Editing
     * @sectionBody These commands increment or decrement a number in a selection.
     * @command incrementNumber
     * @order 5
     *
     * Increase all numbers by 1.
     */
    context.subscriptions.push(
        vscode.commands.registerCommand('selection-utilities.incrementNumber', () =>
            changeNumber({by: 1})
        )
    );

    /**
     * @command decrementNumber
     * @order 5
     *
     * Decrease all numbers by 1.
     */
    context.subscriptions.push(
        vscode.commands.registerCommand('selection-utilities.decrementNumber', () =>
            changeNumber({by: -1})
        )
    );

    /**
     * @command incrementNumberPerSelection
     * @order 5
     *
     * Increase the first selection by 0, the second by 1, the third by 2, etc.
     */
    context.subscriptions.push(
        vscode.commands.registerCommand(
            'selection-utilities.incrementNumberPerSelection',
            () => changeNumber({by: 1, stepEachSelection: true})
        )
    );

    /**
     * @command decrementNumberPerSelection
     * @order 5
     *
     * Decrease the first selection by 0, the second by 1, the third by 2, etc.
     */
    context.subscriptions.push(
        vscode.commands.registerCommand(
            'selection-utilities.decrementNumberPerSelection',
            () => changeNumber({by: -1, stepEachSelection: true})
        )
    );
}
