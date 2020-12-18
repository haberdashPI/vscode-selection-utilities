import * as vscode from 'vscode';
import { updateView } from './selectionMemory';

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

export function registerActiveMotions(context: vscode.ExtensionContext){
    context.subscriptions.push(vscode.commands.
        registerCommand('selection-utilities.exchangeAnchorActive', exchangeAnchorActive));
    context.subscriptions.push(vscode.commands.
        registerCommand('selection-utilities.activeAtEnd', activeAtEnd));
    context.subscriptions.push(vscode.commands.
        registerCommand('selection-utilities.activeAtStart', activeAtStart));
}