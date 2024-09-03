import * as vscode from 'vscode';
import { updateView } from './selectionMemory';
import { getPrimarySelection } from './selectionMemory';
import { clampedLineTranslate } from './util';

function exchangeAnchorActive(){
    let editor = vscode.window.activeTextEditor;
    if(editor){
        editor.selections = editor.selections.map(sel =>
            new vscode.Selection(sel.active,sel.anchor)
        );
        updateView(editor);
    }
}

function activeAtEnd(){
    let editor = vscode.window.activeTextEditor;
    if(editor){
        editor.selections = editor.selections.map(sel =>
            new vscode.Selection(sel.start,sel.end)
        );
        updateView(editor);
    }
}

function activeAtStart(){
    let editor = vscode.window.activeTextEditor;
    if(editor){
        editor.selections = editor.selections.map(sel =>
            new vscode.Selection(sel.end,sel.start)
        );
        updateView(editor);
    }
}

function shrinkToActive(){
    let editor = vscode.window.activeTextEditor;
    if(editor){
        editor.selections = editor.selections.map(sel =>
            new vscode.Selection(sel.active, sel.active)
        );
        updateView(editor);
    }
}

function revealActive(args: { at: "top" | "center" | "bottom" } = { at: "center" }){
    let editor = vscode.window.activeTextEditor;
    if(editor){
        let pos = getPrimarySelection(editor).active;
        vscode.commands.executeCommand('revealLine', { lineNumber: pos.line, at: args.at })
    }
}

function activePageMove(args: { dir?: "up" | "down", count?: number } = {}) {
    let editor = vscode.window.activeTextEditor;
    if (editor) {
        const heights = editor.visibleRanges.map(range => {
            return Math.max(1, range.end.line - range.start.line + 1);
        })
        const minHeight = heights.reduceRight((a, b) => Math.min(a, b));
        let steps = minHeight * (args.count || 1)
        if(args?.dir === 'up'){
            steps *= -1;
        }
        const ed = editor;
        editor.selections = editor.selections.map(sel => {
            const active = clampedLineTranslate(sel.active, ed.document, steps);
            return new vscode.Selection(sel.anchor, active)
        });
        revealActive()
    }
}

export function registerActiveMotions(context: vscode.ExtensionContext){
    context.subscriptions.push(vscode.commands.
        registerCommand('selection-utilities.exchangeAnchorActive', exchangeAnchorActive));
    context.subscriptions.push(vscode.commands.
        registerCommand('selection-utilities.activeAtEnd', activeAtEnd));
    context.subscriptions.push(vscode.commands.
        registerCommand('selection-utilities.activeAtStart', activeAtStart));
    context.subscriptions.push(vscode.commands.
        registerCommand('selection-utilities.shrinkToActive', shrinkToActive));
    context.subscriptions.push(vscode.commands.
        registerCommand('selection-utilities.revealActive', revealActive));
    context.subscriptions.push(vscode.commands.
        registerCommand('selection-utilities.activePageMove', activePageMove)
    )
}
