import * as vscode from 'vscode';
import { updateView } from './selectionMemory';
import { TokenArgs, getInput } from './inputCapture';

export function registerSelectionFilters(context: vscode.ExtensionContext){
    context.subscriptions.push(vscode.commands.
        registerCommand('selection-utilities.includeBy', args => filterBy(args, true)));
    context.subscriptions.push(vscode.commands.
        registerCommand('selection-utilities.excludeBy', args => filterBy(args, false)));
    context.subscriptions.push(vscode.commands.
        registerCommand('selection-utilities.includeByRegex', args => filterBy(args, true,true)));
    context.subscriptions.push(vscode.commands.
        registerCommand('selection-utilities.excludeByRegex', args => filterBy(args, false,true)));
}

function filterBy(args: TokenArgs | undefined, include: boolean, useRegex: boolean = false){
    let editor = vscode.window.activeTextEditor;
    if(editor){
        let ed = editor;
        if(editor.selection.isEmpty && editor.selections.length <= 1){
            return;
        }
        let message = `Enter a ${useRegex ? 'regular expression' : 'string'} to `+
                    ` ${include ? "include" : "exclude"} selections by:`
        let validateInput = (str: string) => {
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
        };
        getInput(args, message, validateInput).then((by?: string) => {
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
