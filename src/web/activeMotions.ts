import * as vscode from 'vscode';
import {updateView} from './selectionMemory';
import {getPrimarySelection} from './selectionMemory';
import {clampedLineTranslate} from './util';

/**
 * @first true
 * @section Active Cursor Motions
 * @sectionBody Active cursor motions change the position of the cursor. The location
 * of the cursor in a selection is called the active end of the selection, while the
 * other end of the selection is called the anchor.
 * @command exchangeAnchorActive
 * @order -10
 *
 * Swaps the position of the cursor from one side of the selection to the other
 */
function exchangeAnchorActive() {
    const editor = vscode.window.activeTextEditor;
    if (editor) {
        editor.selections = editor.selections.map(
            sel => new vscode.Selection(sel.active, sel.anchor)
        );
        updateView(editor);
    }
}

/**
 * @command activeAtEnd
 * @order -10
 *
 * Moves the cursor to the end of the selection
 */
function activeAtEnd() {
    const editor = vscode.window.activeTextEditor;
    if (editor) {
        editor.selections = editor.selections.map(
            sel => new vscode.Selection(sel.start, sel.end)
        );
        updateView(editor);
    }
}

/**
 * @command activeAtStart
 * @order -10
 *
 * Moves the cursor to the start of the selection
 */
function activeAtStart() {
    const editor = vscode.window.activeTextEditor;
    if (editor) {
        editor.selections = editor.selections.map(
            sel => new vscode.Selection(sel.end, sel.start)
        );
        updateView(editor);
    }
}

/**
 * @command shrinkToActive
 * @order -10
 *
 * Shrinks the selection to the position of the cursor
 */
function shrinkToActive() {
    const editor = vscode.window.activeTextEditor;
    if (editor) {
        editor.selections = editor.selections.map(
            sel => new vscode.Selection(sel.active, sel.active)
        );
        updateView(editor);
    }
}

/**
 * @command revealActive
 * @order -10
 *
 * Reveals the line of the primary cursor's position
 *
 * ## Arguments
 * - `at` (default="center") - The window position the line should be positioned at. One of
 *   the following:
 *    - `top`
 *    - `center`
 *    - `bottom`
 *
 */
function revealActive(args: {at: 'top' | 'center' | 'bottom'} = {at: 'center'}) {
    const editor = vscode.window.activeTextEditor;
    if (editor) {
        const pos = getPrimarySelection(editor).active;
        vscode.commands.executeCommand('revealLine', {
            lineNumber: pos.line,
            at: args.at,
        });
    }
}

/**
 * @command activePageMove
 * @order -10
 *
 * Moves the cursor up or down at distance proportionate to the size
 * of the current window.
 *
 * ## Arguments
 * - `dir` (default="down") - The direction to move the cursor. One of the following:
 *   - `up`
 *   - `down`
 * - `count` (default=1) - The distance to move up or down in page units.
 */
function activePageMove(
    args: {dir?: 'up' | 'down'; count?: number; select?: boolean} = {}
) {
    const editor = vscode.window.activeTextEditor;
    if (editor) {
        const heights = editor.visibleRanges.map(range => {
            return Math.max(1, range.end.line - range.start.line + 1);
        });
        const minHeight = heights.reduceRight((a, b) => Math.min(a, b));
        let steps = Math.ceil(minHeight * (args.count || 1));
        if (args?.dir === 'up') {
            steps *= -1;
        }
        const ed = editor;
        editor.selections = editor.selections.map(sel => {
            const active = clampedLineTranslate(sel.active, ed.document, steps);
            let anchor = sel.anchor;
            if (args.select === false) {
                // args.select === undefined defaults to true
                anchor = active;
            }
            return new vscode.Selection(anchor, active);
        });
        revealActive();
    }
}

export function registerActiveMotions(context: vscode.ExtensionContext) {
    context.subscriptions.push(
        vscode.commands.registerCommand(
            'selection-utilities.exchangeAnchorActive',
            exchangeAnchorActive
        )
    );
    context.subscriptions.push(
        vscode.commands.registerCommand('selection-utilities.activeAtEnd', activeAtEnd)
    );
    context.subscriptions.push(
        vscode.commands.registerCommand('selection-utilities.activeAtStart', activeAtStart)
    );
    context.subscriptions.push(
        vscode.commands.registerCommand(
            'selection-utilities.shrinkToActive',
            shrinkToActive
        )
    );
    context.subscriptions.push(
        vscode.commands.registerCommand('selection-utilities.revealActive', revealActive)
    );
    context.subscriptions.push(
        vscode.commands.registerCommand(
            'selection-utilities.activePageMove',
            activePageMove
        )
    );
}
