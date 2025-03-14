import * as vscode from 'vscode';
import {updateView} from './selectionMemory';
import {TokenArgs, getInput} from './inputCapture';

export function registerSelectionFilters(context: vscode.ExtensionContext) {
    /**
     * @command includeBy
     * @order -2
     * @section Selection Filters
     *
     * Include all selections that match the given string.
     *
     * ## Arguments
     * - `text`: Optional; the string selections must match. If not provided, a prompt will
     *   be shown to the user.
     */
    context.subscriptions.push(
        vscode.commands.registerCommand('selection-utilities.includeBy', args =>
            filterBy(args, true)
        )
    );
    /**
     * @command excludeBy
     * @order -2
     *
     * Exclude all selections that match the given string.
     *
     * ## Arguments
     * - `text`: Optional; the string selections must not match. If not provided, a prompt
     *   will be shown to the user.
     */
    context.subscriptions.push(
        vscode.commands.registerCommand('selection-utilities.excludeBy', args =>
            filterBy(args, false)
        )
    );
    /**
     * @command includeByRegex
     * @order -2
     *
     * Include all selections that match the given regex.
     *
     * ## Arguments
     * - `text`: Optional; the regex selections must match. If not provided, a prompt will
     *   be shown to the user.
     */
    context.subscriptions.push(
        vscode.commands.registerCommand('selection-utilities.includeByRegex', args =>
            filterBy(args, true, true)
        )
    );
    /**
     * @command excludeByRegex
     * @order -2
     *
     * Exclude all selections that match the given regex.
     *
     * ## Arguments
     * - `text`: Optional; the regex selections must not match. If not provided, a prompt will
     *   be shown to the user.
     */
    context.subscriptions.push(
        vscode.commands.registerCommand('selection-utilities.excludeByRegex', args =>
            filterBy(args, false, true)
        )
    );
}

function filterBy(
    args: TokenArgs | undefined,
    include: boolean,
    useRegex: boolean = false
) {
    const editor = vscode.window.activeTextEditor;
    if (editor) {
        const ed = editor;
        if (editor.selection.isEmpty && editor.selections.length <= 1) {
            return;
        }
        const message =
            `Enter a ${useRegex ? 'regular expression' : 'string'} to ` +
            ` ${include ? 'include' : 'exclude'} selections by:`;
        const validateInput = (str: string) => {
            if (useRegex) {
                try {
                    new RegExp(str);
                    return undefined;
                } catch {
                    return 'Invalid regular expression';
                }
            } else {
                return undefined;
            }
        };
        getInput(args, message, validateInput).then((by?: string) => {
            if (by !== undefined) {
                const regex = RegExp(
                    useRegex ? by : by.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&')
                );
                const getText = (x: vscode.Selection) =>
                    ed.document.getText(new vscode.Range(x.start, x.end));
                ed.selections = ed.selections.filter(x =>
                    include ? regex.test(getText(x)) : !regex.test(getText(x))
                );
                updateView(ed);
            }
        });
    }
}
