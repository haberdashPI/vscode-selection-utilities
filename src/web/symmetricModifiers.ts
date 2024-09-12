import * as vscode from 'vscode';
import {wrappedTranslate} from './util';

export function registerSymmetricModifiers(context: vscode.ExtensionContext) {
    context.subscriptions.push(
        vscode.commands.registerCommand('selection-utilities.insertAround', insertAround)
    );
    context.subscriptions.push(
        vscode.commands.registerCommand('selection-utilities.deleteAround', deleteAround)
    );
    context.subscriptions.push(
        vscode.commands.registerCommand(
            'selection-utilities.adjustSelections',
            adjustSelections
        )
    );
    context.subscriptions.push(
        vscode.commands.registerCommand(
            'selection-utilities.expandWithinBrackets',
            expandWithinBrackets
        )
    );
    context.subscriptions.push(
        vscode.commands.registerCommand(
            'selection-utilities.expandAroundBrackets',
            expandAroundBrackets
        )
    );
    context.subscriptions.push(
        vscode.commands.registerCommand('selection-utilities.selectBetween', selectBetween)
    );
}

interface InsertAroundArgs {
    before: string;
    after: string;
    expandWith: boolean;
    followCursor: boolean;
}

async function insertAround(args: InsertAroundArgs) {
    const editor = vscode.window.activeTextEditor;
    if (editor) {
        const ed = editor;
        const ranges = editor.selections.map(sel => new vscode.Range(sel.start, sel.end));

        await editor.edit(builder => {
            for (const r of ranges) {
                builder.insert(r.start, args.before);
                builder.insert(r.end, args.after);
            }
        });

        editor.selections = editor.selections.map(sel => {
            if (!sel.isReversed) {
                return new vscode.Selection(
                    wrappedTranslate(
                        sel.anchor,
                        ed.document,
                        args.before.length * (args.expandWith || args.followCursor ? -1 : 0)
                    ),
                    wrappedTranslate(
                        sel.active,
                        ed.document,
                        args.after.length * (args.expandWith || args.followCursor ? 0 : -1)
                    )
                );
            } else {
                return new vscode.Selection(
                    wrappedTranslate(
                        sel.anchor,
                        ed.document,
                        args.before.length *
                            (args.expandWith && !args.followCursor ? 0 : -1)
                    ),
                    wrappedTranslate(
                        sel.active,
                        ed.document,
                        args.after.length * (args.expandWith && !args.followCursor ? -1 : 0)
                    )
                );
            }
        });
    }
}

function deleteAround(args: {count?: number; followCursor: boolean}) {
    const editor = vscode.window.activeTextEditor;
    if (editor) {
        const ed = editor;
        editor.edit(builder => {
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
                            -(1 - offset) * (args.count || 1)
                        ),
                        wrappedTranslate(sel.start, ed.document, offset * (args.count || 1))
                    )
                );
                builder.delete(
                    new vscode.Range(
                        wrappedTranslate(sel.end, ed.document, -offset * (args.count || 1)),
                        wrappedTranslate(
                            sel.end,
                            ed.document,
                            (1 - offset) * (args.count || 1)
                        )
                    )
                );
            }
        });
    }
}

function selectBetween(args: {
    str?: string;
    between?: {from: string; to: string};
    inclusive: false;
}) {
    const editor = vscode.window.activeTextEditor;
    if (editor) {
        const ed = editor;
        ed.selections = ed.selections.map(sel => {
            const seekStart = args.str || args?.between?.from;
            const seekEnd = args.str || args?.between?.to;
            if (!seekStart || !seekEnd) {
                vscode.window.showErrorMessage(
                    'Expected either `str` or `between = {from, to}` field for `selectBetween`'
                );
            } else {
                let start = new vscode.Range(
                    wrappedTranslate(sel.start, ed.document, -seekStart.length),
                    sel.start
                );
                let end = new vscode.Range(
                    sel.end,
                    wrappedTranslate(sel.start, ed.document, seekEnd.length)
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

function adjustSelections(args: {dir: string; count: number}) {
    const editor = vscode.window.activeTextEditor;
    let step = args.count || 1;
    const dirSign = args.dir === 'backward' || args.dir === 'inward' ? -1 : 1;
    const useCursor = args.dir === 'forward' || args.dir === 'backward';
    step = dirSign * step;

    if (editor) {
        const ed = editor;
        editor.selections = editor.selections.map(sel => {
            const sign = useCursor ? 1 : sel.isReversed ? -1 : 1;
            return new vscode.Selection(
                wrappedTranslate(sel.anchor, ed.document, -sign * step),
                wrappedTranslate(sel.active, ed.document, sign * step)
            );
        });
    }
}

function expandWithinBrackets() {
    const editor = vscode.window.activeTextEditor;
    if (editor) {
        const ed = editor;
        editor.selections = editor.selections.map(sel => {
            if (!sel.isEmpty) {
                return new vscode.Selection(
                    wrappedTranslate(sel.start, ed.document, -2),
                    wrappedTranslate(sel.end, ed.document, 2)
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

function expandAroundBrackets() {
    const editor = vscode.window.activeTextEditor;
    if (editor) {
        const ed = editor;
        editor.selections = editor.selections.map(sel => {
            if (!sel.isEmpty) {
                return new vscode.Selection(
                    wrappedTranslate(sel.start, ed.document, -1),
                    wrappedTranslate(sel.end, ed.document, 1)
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
