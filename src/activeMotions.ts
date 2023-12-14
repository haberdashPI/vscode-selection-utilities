import * as vscode from 'vscode';
import { updateView } from './selectionMemory';
import { getPrimarySelection } from './selectionMemory';

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
}
