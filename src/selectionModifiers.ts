import * as vscode from 'vscode';
import { updateView } from './selectionMemory';

export function registerSelectionModifiers(context: vscode.ExtensionContext){
    context.subscriptions.push(vscode.commands.
        registerCommand('selection-utilities.trimSelectionWhitespace', trimSelectionWhitespace));
    context.subscriptions.push(vscode.commands.
        registerCommand('selection-utilities.trimWhitespace', trimWhitespace));
    context.subscriptions.push(vscode.commands.
        registerCommand('selection-utilities.splitByNewline', splitByNewline));
    context.subscriptions.push(vscode.commands.
        registerCommand('selection-utilities.splitBy', splitBy));
    context.subscriptions.push(vscode.commands.
        registerCommand('selection-utilities.splitByRegex', () => splitBy(true)));
    context.subscriptions.push(vscode.commands.
        registerCommand('selection-utilities.createBy', () => splitBy(false, true)));
    context.subscriptions.push(vscode.commands.
        registerCommand('selection-utilities.createByRegex', () => splitBy(true, true)));
}


function trimOneSelectionWhitespace(sel: vscode.Selection, editor: vscode.TextEditor){
    let content = editor.document.getText(new vscode.Range(sel.start,sel.end));

    let leading = content.match(/^\s+/);
    let leadingPos = sel.start;
    if(leading !== null){
        let offset = editor.document.offsetAt(sel.start);
        leadingPos = editor.document.positionAt(offset + leading[0].length);
    }

    let trailing = content.match(/\s+$/);
    let trailingPos = sel.end;
    if(trailing !== null){
        let offset = editor.document.offsetAt(sel.end);
        trailingPos = editor.document.positionAt(offset - trailing[0].length);
    }

    return new vscode.Selection(leadingPos,trailingPos);
}

function trimWhitespace(){
    let editor = vscode.window.activeTextEditor;
    if(editor){
        let ed = editor;
        editor.edit((edit: vscode.TextEditorEdit) => {
            ed.selections.forEach(sel => {
                let trimmed = trimOneSelectionWhitespace(sel, ed);
                edit.delete(new vscode.Range(sel.start,   trimmed.start));
                edit.delete(new vscode.Range(trimmed.end, sel.end));
            });
        });
    }
}

function trimSelectionWhitespace(){
    let editor = vscode.window.activeTextEditor;
    if(editor){
        let ed = editor;
        ed.selections = ed.selections.map(sel => {
            let trimmed = trimOneSelectionWhitespace(sel, ed);
            return new vscode.Selection(trimmed.start, trimmed.end);
        });
    }
}


async function splitByNewline(){
    let editor = vscode.window.activeTextEditor;
    if(editor){
        if(editor.selection.isEmpty && editor.selections.length <= 1){
            return;
        }

        await vscode.commands.executeCommand('editor.action.insertCursorAtEndOfEachLineSelected');
        editor.selections = editor.selections.map(sel =>
            new vscode.Selection(new vscode.Position(sel.active.line,0),sel.active));
        updateView(editor);
    }
}

async function splitBy(useRegex: boolean = false, into: boolean = false){
    let editor = vscode.window.activeTextEditor;
    if(editor){
        let ed = editor;
        if(editor.selection.isEmpty && editor.selections.length <= 1){
            return;
        }
        vscode.window.showInputBox({
            prompt: `Enter a ${useRegex ? 'regular expression' : 'string'} to split `+
                (into ? "into." : "by."),
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
                let newSelections = ed.selections.map(sel => {
                    let lastEnd = sel.start;
                    let newSels: vscode.Selection[] = [];
                    let regex = RegExp(useRegex ? by :
                        by.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&'),"g");
                    for(let [start,end] of matchPos(ed,regex,new vscode.Range(sel.start,sel.end))){
                        if(into){
                            newSels.push(new vscode.Selection(start,end));
                        }else{
                            newSels.push(new vscode.Selection(lastEnd,start));
                            lastEnd = end;
                        }
                    }
                    if(!into){
                        newSels.push(new vscode.Selection(lastEnd,sel.end));
                    }
                    return newSels;
                });
                let flattened = newSelections.reduce((x,y) => x.concat(y), []);

                if(flattened.length > 0){
                    ed.selections = flattened;
                    updateView(ed);
                }else{
                    vscode.window.showErrorMessage("No match for search pattern");
                }
            }
          });
    }
}

function* matchPos(editor: vscode.TextEditor, regex: RegExp, range: vscode.Range){
    let doc = editor.document;
    let line = range.start.line;
    let text = doc.getText(new vscode.Range(range.start,doc.lineAt(line).range.end));
    let offset = range.start.character;
    while(line <= range.end.line){
        regex.lastIndex = 0;
        let match = regex.exec(text);
        while(match !== null){
            yield [new vscode.Position(line,match.index+offset),
                   new vscode.Position(line,match.index+offset+match[0].length)];
            let lastIndex = regex.lastIndex;
            match = regex.exec(text);
            // avoid repeating the same regex match (for zero length matches)
            if(lastIndex === regex.lastIndex){
                regex.lastIndex++;
            }
        }
        line++;
        offset = 0;
        if(line >= editor.document.lineCount){
            return;
        }else{
            text = doc.getText(new vscode.Range(new vscode.Position(line,0),
                doc.lineAt(line).range.end));
        }
    }
    return;
}
