import * as vscode from 'vscode';
import { updateView } from './selectionMemory';
import {
    TokenArgs,
    RegexTokenArgs,
    tokenArgs,
    regexTokenArgs,
    getInput,
} from './inputCapture';
import { validateInput } from './util';

export function registerSelectionModifiers(context: vscode.ExtensionContext) {
    context.subscriptions.push(
        vscode.commands.registerCommand(
            'selection-utilities.trimSelectionWhitespace',
            trimSelectionWhitespace,
        ),
    );
    context.subscriptions.push(
        vscode.commands.registerCommand(
            'selection-utilities.trimWhitespace',
            trimWhitespace,
        ),
    );
    context.subscriptions.push(
        vscode.commands.registerCommand(
            'selection-utilities.trimWhitespaceAround',
            trimWhitespaceAround,
        ),
    );
    context.subscriptions.push(
        vscode.commands.registerCommand(
            'selection-utilities.splitByNewline',
            splitByNewline,
        ),
    );
    context.subscriptions.push(
        vscode.commands.registerCommand(
            'selection-utilities.splitBy',
            (args_: unknown) => {
                const args = validateInput('selection-utilities.splitBy', args_, tokenArgs);
                if (!args) {
                    return;
                }
                splitBy(args);
            },
        ),
    );
    context.subscriptions.push(
        vscode.commands.registerCommand(
            'selection-utilities.splitByRegex',
            (args_: unknown) => {
                const args = validateInput(
                    'selection-utilities.splitByRegex',
                    args_,
                    regexTokenArgs,
                );
                if (!args) {
                    return;
                }
                splitBy(args, true);
            },
        ),
    );
    context.subscriptions.push(
        vscode.commands.registerCommand(
            'selection-utilities.createBy',
            (args_: unknown) => {
                const args = validateInput(
                    'selection-utilities.createBy',
                    args_,
                    tokenArgs,
                );
                if (!args) {
                    return;
                }
                splitBy(args, false, true);
            },
        ),
    );
    context.subscriptions.push(
        vscode.commands.registerCommand(
            'selection-utilities.createByRegex',
            (args_: unknown) => {
                const args = validateInput(
                    'selection-utilities.createByRegex',
                    args_,
                    regexTokenArgs,
                );
                if (!args) {
                    return;
                }
                splitBy(args, true, true);
            },
        ),
    );
}

function trimOneSelectionWhitespace(sel: vscode.Selection, editor: vscode.TextEditor) {
    const content = editor.document.getText(new vscode.Range(sel.start, sel.end));

    const leading = content.match(/^\s+/);
    let leadingPos = sel.start;
    if (leading !== null) {
        const offset = editor.document.offsetAt(sel.start);
        leadingPos = editor.document.positionAt(offset + leading[0].length);
    }

    const trailing = content.match(/\s+$/);
    let trailingPos = sel.end;
    if (trailing !== null) {
        const offset = editor.document.offsetAt(sel.end);
        trailingPos = editor.document.positionAt(offset - trailing[0].length);
    }

    return new vscode.Selection(leadingPos, trailingPos);
}

const HORIZONTAL_WHITESPACE = /[^\S\r\n]/;

function getLeftmostWhitespace(
    document: vscode.TextDocument,
    pos: vscode.Position,
): vscode.Position {
    const line = document.lineAt(pos.line);
    let char = pos.character;
    while (char > 0 && HORIZONTAL_WHITESPACE.test(line.text[char - 1])) {
        char--;
    }
    return new vscode.Position(pos.line, char);
}

function getRightmostWhitespace(
    document: vscode.TextDocument,
    pos: vscode.Position,
): vscode.Position {
    const line = document.lineAt(pos.line);
    let char = pos.character;
    while (char < line.text.length && HORIZONTAL_WHITESPACE.test(line.text[char])) {
        char++;
    }
    return new vscode.Position(pos.line, char);
}

function mergeRanges(ranges: vscode.Range[]): vscode.Range[] {
    const nonActiveRanges = ranges.filter(r => !r.isEmpty);
    nonActiveRanges.sort((a, b) => {
        if (a.start.isBefore(b.start)) return -1;
        if (a.start.isAfter(b.start)) return 1;
        if (a.end.isBefore(b.end)) return -1;
        if (a.end.isAfter(b.end)) return 1;
        return 0;
    });

    const merged: vscode.Range[] = [];
    for (const range of nonActiveRanges) {
        if (merged.length === 0) {
            merged.push(range);
        } else {
            const last = merged[merged.length - 1];
            if (range.start.isBeforeOrEqual(last.end)) {
                const newEnd = range.end.isAfter(last.end) ? range.end : last.end;
                merged[merged.length - 1] = new vscode.Range(last.start, newEnd);
            } else {
                merged.push(range);
            }
        }
    }
    return merged;
}

function deleteRanges(
    editor: vscode.TextEditor,
    ranges: vscode.Range[],
): Thenable<boolean> {
    const merged = mergeRanges(ranges);
    return editor.edit((edit: vscode.TextEditorEdit) => {
        merged.forEach((range) => {
            edit.delete(range);
        });
    });
}

async function trimWhitespaceImpl(around: boolean) {
    const editor = vscode.window.activeTextEditor;
    if (editor) {
        const rangesToDelete: vscode.Range[] = [];

        editor.selections.forEach((sel) => {
            if (sel.isEmpty) {
                if (!around) {
                    return;
                }
                const wordRange = editor.document.getWordRangeAtPosition(sel.start);
                if (wordRange !== undefined) {
                    const left = getLeftmostWhitespace(editor.document, wordRange.start);
                    rangesToDelete.push(new vscode.Range(left, wordRange.start));
                    const right = getRightmostWhitespace(editor.document, wordRange.end);
                    rangesToDelete.push(new vscode.Range(wordRange.end, right));
                } else {
                    const left = getLeftmostWhitespace(editor.document, sel.start);
                    const right = getRightmostWhitespace(editor.document, sel.start);
                    rangesToDelete.push(new vscode.Range(left, right));
                }
            } else {
                const normalizedStart = sel.start.isBefore(sel.end) ? sel.start : sel.end;
                const normalizedEnd = sel.start.isBefore(sel.end) ? sel.end : sel.start;
                const content = editor.document.getText(
                    new vscode.Range(normalizedStart, normalizedEnd),
                );
                let left = normalizedStart;
                let right = normalizedEnd;
                if (around) {
                    left = getLeftmostWhitespace(editor.document, normalizedStart);
                    right = getRightmostWhitespace(editor.document, normalizedEnd);
                }

                if (content.trim().length === 0) {
                    rangesToDelete.push(new vscode.Range(left, right));
                } else {
                    const trimmed = trimOneSelectionWhitespace(
                        new vscode.Selection(normalizedStart, normalizedEnd),
                        editor,
                    );
                    rangesToDelete.push(new vscode.Range(left, trimmed.start));
                    rangesToDelete.push(new vscode.Range(trimmed.end, right));
                }
            }
        });

        return deleteRanges(editor, rangesToDelete);
    }
}

/**
 * @section Selection Editing
 * @sectionBody These commands tweak or modify what is selected.
 * @command trimWhitespace
 *
 * Trims whitespace at the start and end of the selection(s).
 */
async function trimWhitespace() {
    return trimWhitespaceImpl(false);
}

/**
 * @command trimWhitespaceAround
 *
 * Trims whitespace that is before or after selection(s) or surrounding word when cursor is
 * empty.
 */
async function trimWhitespaceAround() {
    return trimWhitespaceImpl(true);
}

/**
 * @command trimSelectionWhitespace
 *
 * Trims a selection so that it excludes leading and trailing whitespace.
 */

function trimSelectionWhitespace() {
    const editor = vscode.window.activeTextEditor;
    if (editor) {
        const ed = editor;
        ed.selections = ed.selections.map((sel) => {
            const trimmed = trimOneSelectionWhitespace(sel, ed);
            return new vscode.Selection(trimmed.start, trimmed.end);
        });
    }
}

/**
 * @command splitByNewline
 *
 * Split the selection(s), making each line a separate selection.
 */
async function splitByNewline() {
    const editor = vscode.window.activeTextEditor;
    if (editor) {
        if (editor.selection.isEmpty && editor.selections.length <= 1) {
            return;
        }

        await vscode.commands.executeCommand(
            'editor.action.insertCursorAtEndOfEachLineSelected',
        );
        editor.selections = editor.selections.map(
            sel => new vscode.Selection(
                new vscode.Position(sel.active.line, 0), sel.active,
            ),
        );
        updateView(editor);
    }
}

/**
 * @command splitBy
 *
 * Split the selection(s) by a string expression.
 *
 *
 * ## Arguments
 * - `text`: the string to split selections by. If not provided, a prompt will be shown to
 *   the user.
 */

/**
 * @command splitByRegex
 *
 * Split the selection(s) by a regular expression.
 *
 *
 * ## Arguments
 * - `text`: the regex to split selections by. If not provided, a prompt will be shown to
 *   the user.
 */

/**
 * @command createBy
 *
 * Create a new set of selections matching a given string that all fall within
 * the current selection ranges.
 *
 *
 * ## Arguments
 * - `text`: the string to create selections by. If not provided, a prompt will be shown to
 *   the user.
 */

/**
 * @command createByRegex
 *
 * Create a new set of selections matching a given regex that all fall within
 * the current selection ranges.
 *
 *
 * ## Arguments
 * - `text`: the regex to create selections by. If not provided, a prompt will be shown to
 *   the user.
 */

async function splitBy(
    args: TokenArgs | RegexTokenArgs | undefined,
    useRegex: boolean = false,
    into: boolean = false,
) {
    const editor = vscode.window.activeTextEditor;
    if (editor) {
        const ed = editor;
        if (editor.selection.isEmpty && editor.selections.length <= 1) {
            return;
        }
        const message =
            `Enter a ${useRegex ? 'regular expression' : 'string'} to split ` +
            (into ? 'into.' : 'by.');
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
                const newSelections = ed.selections.map((sel) => {
                    let lastEnd = sel.start;
                    const newSels: vscode.Selection[] = [];
                    const regex = RegExp(
                        useRegex ? by : by.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&'),
                        'g',
                    );
                    for (const [start, end] of matchPos(
                        ed,
                        regex,
                        new vscode.Range(sel.start, sel.end),
                    )) {
                        if (into) {
                            newSels.push(new vscode.Selection(start, end));
                        } else {
                            newSels.push(new vscode.Selection(lastEnd, start));
                            lastEnd = end;
                        }
                    }
                    if (!into) {
                        newSels.push(new vscode.Selection(lastEnd, sel.end));
                    }
                    return newSels;
                });
                const flattened = newSelections.reduce((x, y) => x.concat(y), []);

                if (flattened.length > 0) {
                    ed.selections = flattened;
                    updateView(ed);
                } else {
                    vscode.window.showErrorMessage('No match for search pattern');
                }
            }
        });
    }
}

function* matchPos(editor: vscode.TextEditor, regex: RegExp, range: vscode.Range) {
    const doc = editor.document;
    let line = range.start.line;
    const getLineText = (pos: vscode.Position, limit: vscode.Position) =>
        doc.getText(new vscode.Range(pos, limit).intersection(doc.lineAt(pos.line).range));
    let text = getLineText(range.start, range.end);
    let offset = range.start.character;
    while (line <= range.end.line) {
        regex.lastIndex = 0;
        let match = regex.exec(text);
        while (match !== null) {
            yield [
                new vscode.Position(line, match.index + offset),
                new vscode.Position(line, match.index + offset + match[0].length),
            ];
            const lastIndex = regex.lastIndex;
            match = regex.exec(text);
            // avoid repeating the same regex match (for zero length matches)
            if (lastIndex === regex.lastIndex) {
                regex.lastIndex++;
            }
        }
        line++;
        offset = 0;
        if (line >= editor.document.lineCount) {
            return;
        } else {
            text = getLineText(new vscode.Position(line, 0), range.end);
        }
    }
    return;
}
