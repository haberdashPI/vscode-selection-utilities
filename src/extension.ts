// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';

let activeSelectDecorator: vscode.TextEditorDecorationType;
let savedSelectDecorator: vscode.TextEditorDecorationType;

function updateActiveSelection(editor: vscode.TextEditor, sel: ReadonlyArray<vscode.Selection>){
    if(sel.length > 1){
        editor.setDecorations(
            activeSelectDecorator,
            [new vscode.Range(sel[0].start, sel[0].end)]
        );
    }else{
        editor.setDecorations(
            activeSelectDecorator,
            []
        );
    }
}

function updateSavedSelection(editor: vscode.TextEditor){
    let mainSave = selectionRegisters['default'];
    if(mainSave && mainSave.length > 0){
        editor.setDecorations(
            savedSelectDecorator,
            mainSave.map(x => new vscode.Range(x.start,x.end))
        );
    }else{
        editor.setDecorations(
            savedSelectDecorator,
            []
        );
    }
}

interface IHash<T> {
    [details: string]: T;
}
let selectionRegisters: IHash<vscode.Selection[]> = {};

interface SelectMemoryArgs{
    register?: string;
}

function getSelectMemory(args: SelectMemoryArgs){
    let register = 'default';
    if(args?.register !== undefined){
        register = args.register;
    }

    let memory: vscode.Selection[] = [];
    if(selectionRegisters[register] !== undefined){
        memory = selectionRegisters[register];
    }

    return memory.sort((a,b) => a.anchor.line !== b.anchor.line ?
        a.anchor.line - b.anchor.line :
        a.anchor.character - b.anchor.character);
}

function saveSelectMemory(sels: vscode.Selection[], args: SelectMemoryArgs,
    editor: vscode.TextEditor){

    let register = 'default';
    if(args?.register !== undefined){
        register = args.register;
    }

    selectionRegisters[register] = sels;
    updateSavedSelection(editor);
}

function curSelectionOrWord(editor: vscode.TextEditor){
    // if there's no selection add the word under the cursor
    // to the selection memory
    if(editor.selections.length === 1 && editor.selection.isEmpty){
        let range = editor.document.
            getWordRangeAtPosition(editor.selection.start);
        if(range !== undefined){
            return [new vscode.Selection(range.start,range.end)];
        }
    }
    return editor.selections;
}

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {

    activeSelectDecorator = vscode.window.createTextEditorDecorationType({
        backgroundColor: "rgba(150,50,50,0.4)"
    });

    savedSelectDecorator = vscode.window.createTextEditorDecorationType({
        backgroundColor: "rgba(150,50,150,0.4)"
    });

    vscode.window.onDidChangeTextEditorSelection(e =>
        updateActiveSelection(e.textEditor,e.selections));

    context.subscriptions.push(vscode.commands.
        registerCommand('selection-utilities.exchange-anchor-active', () => {
            let editor = vscode.window.activeTextEditor;
            if(editor){
                editor.selections = editor.selections.map(sel =>
                    new vscode.Selection(sel.active,sel.anchor)
                );
                let pos = editor.selection.active;
                editor.revealRange(new vscode.Range(pos,pos));
            }
    }));

    context.subscriptions.push(vscode.commands.
        registerCommand('selection-utilities.active-at-end', () => {
            let editor = vscode.window.activeTextEditor;
            if(editor){
                editor.selections = editor.selections.map(sel =>
                    new vscode.Selection(sel.start,sel.end)
                );
                let pos = editor.selection.active;
                editor.revealRange(new vscode.Range(pos,pos));
            }
    }));

    context.subscriptions.push(vscode.commands.
        registerCommand('selection-utilities.active-at-start', () => {
            let editor = vscode.window.activeTextEditor;
            if(editor){
                editor.selections = editor.selections.map(sel =>
                    new vscode.Selection(sel.end,sel.start)
                );
                let pos = editor.selection.active;
                editor.revealRange(new vscode.Range(pos,pos));
            }
    }));

    context.subscriptions.push(vscode.commands.
        registerCommand('selection-utilities.move-primary-left', () => {
            let editor = vscode.window.activeTextEditor;
            if(editor){
                let last = editor.selections.pop();
                if(last){ editor.selections.unshift(last); }
                let pos = editor.selection.active;
                editor.revealRange(new vscode.Range(pos,pos));
                updateActiveSelection(editor, editor.selections);
            }
    }));

    context.subscriptions.push(vscode.commands.
        registerCommand('selection-utilities.move-primary-right', () => {
            let editor = vscode.window.activeTextEditor;
            if(editor){
                let first = editor.selections.splice(0,1);
                if(first && first.length > 0){
                    editor.selections.push(first[0]);
                }
                let pos = editor.selection.active;
                editor.revealRange(new vscode.Range(pos,pos));
                updateActiveSelection(editor, editor.selections);
            }
    }));

    context.subscriptions.push(vscode.commands.
        registerCommand('selection-utilities.append-to-memory',
            (args: SelectMemoryArgs) => {
            let editor = vscode.window.activeTextEditor;
            if(editor){
                let memory = getSelectMemory(args);
                memory = memory.concat(curSelectionOrWord(editor));
                saveSelectMemory(memory,args,editor);
            }
        }));

    context.subscriptions.push(vscode.commands.
        registerCommand('selection-utilities.restore-and-clear',
            (args: SelectMemoryArgs) => {
                let editor = vscode.window.activeTextEditor;
                if(editor){
                    let memory = getSelectMemory(args);
                    if(memory !== undefined){
                        editor.selections = memory;
                    }
                    saveSelectMemory([],args,editor);

                    let pos = editor.selection.active;
                    editor.revealRange(new vscode.Range(pos,pos));
                }
            }));

    context.subscriptions.push(vscode.commands.
        registerCommand('selection-utilities.swap-with-memory',
            (args: SelectMemoryArgs) => {
                let editor = vscode.window.activeTextEditor;
                if(editor){
                    let memory = getSelectMemory(args);
                    if(memory.length === 0){
                        saveSelectMemory(curSelectionOrWord(editor),args,editor);
                    }else if(memory.length !== editor.selections.length){
                        vscode.window.showErrorMessage('Number of saved '+
                            'selections must match the current number of '+
                            'selections.');
                    }else{
                        editor.edit(swapWithMemoryFn(editor,editor.selections,memory));
                        saveSelectMemory([],args,editor);
                    }
                }
            }));

    context.subscriptions.push(vscode.commands.
        registerCommand('selection-utilities.cancel-selection', () => {
            let editor = vscode.window.activeTextEditor;
            if(editor){
                let pos = editor.selections[0].active;
                saveSelectMemory(editor.selections,{register: 'cancel'},editor);
                editor.selection = new vscode.Selection(pos,pos);
            }
        }));
}

function swapWithMemoryFn(editor: vscode.TextEditor,
    current: vscode.Selection[], old: vscode.Selection[]){

    let curText = current.map(sel =>
        editor.document.getText(new vscode.Range(sel.start,sel.end))
    );
    let oldText = old.map(sel =>
        editor.document.getText(new vscode.Range(sel.start,sel.end))
    );
    return (edit: vscode.TextEditorEdit) => {
        current.forEach((sel,i) => {
            edit.replace(sel,oldText[i]);
        });
        old.forEach((sel,i) => {
            edit.replace(sel,curText[i]);
        });
    };
}

// this method is called when your extension is deactivated
export function deactivate() {}
