import * as vscode from 'vscode';
import z from 'zod';
import { wrappedTranslate, validateInput } from './util';

export function registerSymmetricModifiers(context: vscode.ExtensionContext) {
    context.subscriptions.push(
        vscode.commands.registerCommand('selection-utilities.insertAround', insertAround),
    );
    context.subscriptions.push(
        vscode.commands.registerCommand('selection-utilities.deleteAround', deleteAround),
    );
    context.subscriptions.push(
        vscode.commands.registerCommand(
            'selection-utilities.adjustSelections',
            adjustSelections,
        ),
    );
    context.subscriptions.push(
        vscode.commands.registerCommand(
            'selection-utilities.expandWithinBrackets',
            expandWithinBrackets,
        ),
    );
    context.subscriptions.push(
        vscode.commands.registerCommand(
            'selection-utilities.expandAroundBrackets',
            expandAroundBrackets,
        ),
    );
    context.subscriptions.push(
        vscode.commands.registerCommand('selection-utilities.selectBetween', selectBetween),
    );
}

export const insertAroundArgs = z.
    object({
        before: z.string().default(''),
        after: z.string().default(''),
        expandWith: z.boolean().default(false),
        followCursor: z.boolean().default(false),
    }).
    strict();

export type InsertAroundArgs = z.infer<typeof insertAroundArgs>;

/**
 * @section Symmetric Editing
 * @sectionBody These commands modify text or the selection at both ends of the current
 * selections.
 * @command insertAround
 * @order 10
 *
 * Insert text before and after each selection.
 *
 * ## Arguments
 * - `before`: the text to insert before each selection.
 * - `after`: the text to insert after each selection.
 * - `expandWith`: (default `false`) expand the selection to include the inserted text.
 * - `followCursor`: (default `false`) if the cursor is at the start of the selection
 *    selection will expand to include the cursor, and if its at the end it will not expand.
 *    Expanding in this way leads to a natural symmetric typing experience when typing
 *    multiple keys.
 *
 * This command is best used in conjunction with
 * [Master Key](https://github.com/haberdashPI/vscode-master-key).
 * See
 * [`whenNoBinding.run`](https://haberdashpi.github.io/vscode-master-key/bindings/mode.html#fields)
 */
async function insertAround(args_: unknown) {
    const args = validateInput(
        'selection-utilities.insertAround',
        args_,
        insertAroundArgs,
    );
    if (!args) {
        return;
    }
    const editor = vscode.window.activeTextEditor;
    if (editor) {
        const ed = editor;
        const ranges = editor.selections.map(sel => new vscode.Range(sel.start, sel.end));

        await editor.edit((builder) => {
            for (const r of ranges) {
                builder.insert(r.start, args.before);
                builder.insert(r.end, args.after);
            }
        });

        editor.selections = editor.selections.map((sel) => {
            if (!sel.isReversed) {
                return new vscode.Selection(
                    wrappedTranslate(
                        sel.anchor,
                        ed.document,
                        args.before.length *
                        (args.expandWith || args.followCursor ? -1 : 0),
                    ),
                    wrappedTranslate(
                        sel.active,
                        ed.document,
                        args.after.length * (args.expandWith || args.followCursor ? 0 : -1),
                    ),
                );
            } else {
                return new vscode.Selection(
                    wrappedTranslate(
                        sel.anchor,
                        ed.document,
                        args.before.length *
                        (args.expandWith && !args.followCursor ? 0 : -1),
                    ),
                    wrappedTranslate(
                        sel.active,
                        ed.document,
                        args.after.length *
                        (args.expandWith && !args.followCursor ? -1 : 0),
                    ),
                );
            }
        });
    }
}

/**
 * @command deleteAround
 * @order 10
 *
 * Delete characters at the start and end of each selection.
 *
 * ## Arguments
 * - `count`: (default `1`) the number of characters to delete.
 * - `followCursor`: (default `false`) if the cursor is at the start of the selection
 *    selection will expand to include the cursor, and if its at the end it will not expand.
 *    Expanding in this way leads to a natural symmetric typing experience when typing
 *    multiple keys.
 *
 * This command is best used in conjunction with
 * [Master Key](https://github.com/haberdashPI/vscode-master-key).
 * See
 * [`whenNoBinding.run`](https://haberdashpi.github.io/vscode-master-key/bindings/mode.html#fields)
 */
export const deleteAroundArgs = z.
    object({
        count: z.number().default(1),
        followCursor: z.boolean().default(false),
    }).
    strict();

export type DeleteAroundArgs = z.infer<typeof deleteAroundArgs>;

function deleteAround(args_?: unknown) {
    const args = validateInput(
        'selection-utilities.deleteAround',
        args_,
        deleteAroundArgs,
    );
    if (!args) {
        return;
    }
    const editor = vscode.window.activeTextEditor;
    if (editor) {
        const ed = editor;
        editor.edit((builder) => {
            for (const sel of ed.selections) {
                let offset = 0;
                if (sel.isReversed && args.followCursor) {
                    offset = 1;
                }
                builder.delete(
                    new vscode.Range(
                        wrappedTranslate(
                            sel.start,
                            ed.document,
                            -(1 - offset) * args.count,
                        ),
                        wrappedTranslate(
                            sel.start,
                            ed.document,
                            offset * args.count,
                        ),
                    ),
                );
                builder.delete(
                    new vscode.Range(
                        wrappedTranslate(sel.end, ed.document, -offset * args.count),
                        wrappedTranslate(
                            sel.end,
                            ed.document,
                            (1 - offset) * args.count,
                        ),
                    ),
                );
            }
        });
    }
}

/**
 * @command selectBetween
 * @order 10
 *
 * Select text between the start and end of of a given set of characters.
 *
 * ## Arguments
 * - `str`: text that starts and ends with this string will be selected. You can only
 *   specify this if `between` isn't specified
 * - `between`: an object with `from` and `to` fields; text that starts with `from` and ends
 *   with `to` will be selected. You can only specify this if `str` isn't specified.
 * - `inclusive`: whether to include the characters that start and end the selection (e.g.
 *   `str` or `between`)
 */
export const selectBetweenArgs = z.
    object({
        str: z.string().optional(),
        between: z.
            object({
                from: z.string(),
                to: z.string(),
            }).
            strict().
            optional(),
        inclusive: z.boolean().default(false),
    }).
    strict().
    refine(
        data => (data.str !== undefined) !== (data.between !== undefined),
        {
            message:
                'Expected either `str` or `between = {from, to}` field for `selectBetween`',
        },
    );

export type SelectBetweenArgs = z.infer<typeof selectBetweenArgs>;

function selectBetween(args_?: unknown) {
    const args = validateInput(
        'selection-utilities.selectBetween',
        args_,
        selectBetweenArgs,
    );
    if (!args) {
        return;
    }
    const editor = vscode.window.activeTextEditor;
    if (editor) {
        const ed = editor;
        ed.selections = ed.selections.map((sel) => {
            const seekStart = args.str || args?.between?.from;
            const seekEnd = args.str || args?.between?.to;
            if (!seekStart || !seekEnd) {
                vscode.window.showErrorMessage(
                    'Expected either `str` or `between = {from, to}` field ' +
                    'for `selectBetween`',
                );
            } else {
                let start = new vscode.Range(
                    wrappedTranslate(sel.start, ed.document, -seekStart.length),
                    sel.start,
                );
                let end = new vscode.Range(
                    sel.end,
                    wrappedTranslate(sel.start, ed.document, seekEnd.length),
                );
                let startStr = ed.document.getText(start);
                while (startStr.length === seekStart.length) {
                    if (startStr === seekStart) {
                        break;
                    }
                    const startFrom = wrappedTranslate(start.end, ed.document, -1);
                    const startTo = wrappedTranslate(start.start, ed.document, -1);
                    start = new vscode.Range(startTo, startFrom);
                    startStr = ed.document.getText(start);
                }

                let endStr = ed.document.getText(end);
                while (endStr.length === seekStart?.length) {
                    if (endStr === seekEnd) {
                        break;
                    }
                    const endFrom = wrappedTranslate(end.end, ed.document, 1);
                    const endTo = wrappedTranslate(end.start, ed.document, 1);
                    end = new vscode.Range(endTo, endFrom);
                    endStr = ed.document.getText(end);
                }

                if (startStr === seekStart && endStr === seekEnd) {
                    if (args.inclusive) {
                        return new vscode.Selection(start.start, end.end);
                    } else {
                        return new vscode.Selection(start.end, end.start);
                    }
                }
            }
            return sel;
        });
    }
}

/**
 * @command adjustSelections
 * @order 10
 *
 * Adjust the selection inwards or outwards from both sides.
 *
 * ## Arguments
 * - `dir`: how to move the selection
 *   - `inward`: move both ends of the selection so that the selection shrinks
 *   - `outward`: move both ends of the selection so that the selection grows
 *   - `forward`: if the cursor is at the start of a selection move both ends of the
 *     selection inwards, if the cursor is at the end of a selection move both ends of the
 *     selection outwards
 *   - `backward`: if the cursor is at the start of a selection move both ends of the
 *     selection outwards, if the cursor is at the end of a selection move both ends of the
 *     selection inwards
 * - `count`: (default 1) how many characters to move by when adjusting selection ends
 */
export const adjustSelectionsArgs = z.
    object({
        dir: z.enum(['inward', 'outward', 'forward', 'backward']).default('forward'),
        count: z.number().default(1),
    }).
    strict();

export type AdjustSelectionsArgs = z.infer<typeof adjustSelectionsArgs>;

function adjustSelections(args_?: unknown) {
    const args = validateInput(
        'selection-utilities.adjustSelections',
        args_,
        adjustSelectionsArgs,
    );
    if (!args) {
        return;
    }
    const editor = vscode.window.activeTextEditor;
    let step = args.count;
    const dirSign = args.dir === 'backward' || args.dir === 'inward' ? -1 : 1;
    const useCursor = args.dir === 'forward' || args.dir === 'backward';
    step = dirSign * step;

    if (editor) {
        const ed = editor;
        editor.selections = editor.selections.map((sel) => {
            const sign = useCursor ? 1 : sel.isReversed ? -1 : 1;
            return new vscode.Selection(
                wrappedTranslate(sel.anchor, ed.document, -sign * step),
                wrappedTranslate(sel.active, ed.document, sign * step),
            );
        });
    }
}

/**
 * @command expandWithinBrackets
 * @order 10
 *
 * Expand the selection to contain all character inside brackets, exclusive of those
 * brackets. Calling the command multiple times will expand to the next set of surrounding
 * brackets.
 */
function expandWithinBrackets() {
    const editor = vscode.window.activeTextEditor;
    if (editor) {
        const ed = editor;
        editor.selections = editor.selections.map((sel) => {
            if (!sel.isEmpty) {
                return new vscode.Selection(
                    wrappedTranslate(sel.start, ed.document, -2),
                    wrappedTranslate(sel.end, ed.document, 2),
                );
            } else {
                return sel;
            }
        });
        vscode.commands.executeCommand('editor.action.selectToBracket', {
            selectBrackets: false,
        });
    }
}

/**
 * @command expandAroundBrackets
 * @order 10
 *
 * Expand the selection to contain all character inside brackets, inclusive of those
 * brackets. Calling the command multiple times will expand to the next set of surrounding
 * brackets.
 */

function expandAroundBrackets() {
    const editor = vscode.window.activeTextEditor;
    if (editor) {
        const ed = editor;
        editor.selections = editor.selections.map((sel) => {
            if (!sel.isEmpty) {
                return new vscode.Selection(
                    wrappedTranslate(sel.start, ed.document, -1),
                    wrappedTranslate(sel.end, ed.document, 1),
                );
            } else {
                return sel;
            }
        });
        vscode.commands.executeCommand('editor.action.selectToBracket', {
            selectBrackets: true,
        });
    }
}
