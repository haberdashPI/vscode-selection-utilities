import * as vscode from 'vscode';
import { updateView } from './selectionMemory';

export function registerSelectionFilters(context: vscode.ExtensionContext){
    context.subscriptions.push(vscode.commands.
        registerCommand('selection-utilities.includeBy', () => filterBy(true)));
    context.subscriptions.push(vscode.commands.
        registerCommand('selection-utilities.excludeBy', () => filterBy(false)));
    context.subscriptions.push(vscode.commands.
        registerCommand('selection-utilities.includeByRegex', () => filterBy(true,true)));
    context.subscriptions.push(vscode.commands.
        registerCommand('selection-utilities.excludeByRegex', () => filterBy(false,true)));
}


function filterBy(include: boolean, useRegex: boolean = false){
    let editor = vscode.window.activeTextEditor;
    if(editor){
        let ed = editor;
        if(editor.selection.isEmpty && editor.selections.length <= 1){
            return;
        }
        vscode.window.showInputBox({
            prompt: `Enter a ${useRegex ? 'regular expression' : 'string'} to `+
                    ` ${include ? "include" : "exclude"} selections by:`,
            validateInput: (str: string) => {
                if(useRegex){
                    try{
                        new RegExp(str);
                        return undefined;
                    }catch{
                        return "Invalid regular expression";
                    }
                }else{
                    return undefined;
                }
            }
        }).then((by?: string) => {
            if(by !== undefined){
                let regex = RegExp(useRegex ? by :
                    by.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&'));
                let getText = (x: vscode.Selection) =>
                    ed.document.getText(new vscode.Range(x.start,x.end));
                ed.selections =
                    ed.selections.filter(x => include ?
                        regex.test(getText(x)) : !regex.test(getText(x)));
                updateView(ed);
            }
        });
    }
}
