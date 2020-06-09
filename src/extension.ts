// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import { addListener } from 'cluster';
import { resolveAny } from 'dns';
import { ok } from 'assert';

let activeSelectDecorator: vscode.TextEditorDecorationType;
let savedSelectDecorator: vscode.TextEditorDecorationType;
let primarySelection = 0;

function updateActiveSelection(editor: vscode.TextEditor, sel: ReadonlyArray<vscode.Selection>){
    if(sel.length > 1){
        if(primarySelection >= sel.length){
            primarySelection = 0;
        }
        editor.setDecorations(
            activeSelectDecorator,
            [new vscode.Range(sel[primarySelection].start,
                              sel[primarySelection].end)]
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

function compareSels(a: vscode.Selection, b: vscode.Selection){
    let active = a.active.compareTo(b.active);
    if(active === 0){
        return a.anchor.compareTo(b.anchor);
    }else{
        return active;
    }
}

function getSelectMemory(args: SelectMemoryArgs,order: boolean = true){
    let register = 'default';
    if(args?.register !== undefined){
        register = args.register;
    }

    let memory: vscode.Selection[] = [];
    if(selectionRegisters[register] !== undefined){
        memory = selectionRegisters[register];
    }

    return order ? memory.sort(compareSels) : memory;
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
        registerCommand('selection-utilities.exchange-anchor-active', exchangeAnchorActive));
    context.subscriptions.push(vscode.commands.
        registerCommand('selection-utilities.active-at-end', activeAtEnd));
    context.subscriptions.push(vscode.commands.
        registerCommand('selection-utilities.active-at-start', activeAtStart));
    context.subscriptions.push(vscode.commands.
        registerCommand('selection-utilities.move-primary-left', movePrimaryLeft));
    context.subscriptions.push(vscode.commands.
        registerCommand('selection-utilities.move-primary-right', movePrimaryRight));
    context.subscriptions.push(vscode.commands.
        registerCommand('selection-utilities.append-to-memory',appendToMemory));
    context.subscriptions.push(vscode.commands.
        registerCommand('selection-utilities.restore-and-clear',restoreAndClear));
    context.subscriptions.push(vscode.commands.
        registerCommand('selection-utilities.swap-with-memory',swapWithMemory));
    context.subscriptions.push(vscode.commands.
        registerCommand('selection-utilities.cancel-selection',cancelSelection));
    context.subscriptions.push(vscode.commands.
        registerCommand('selection-utilities.delete-last-saved',deleteLastSaved));
    context.subscriptions.push(vscode.commands.
        registerCommand('selection-utilities.delete-primary', deletePrimary));
    context.subscriptions.push(vscode.commands.
        registerCommand('selection-utilities.add-next',addNext));
    context.subscriptions.push(vscode.commands.
        registerCommand('selection-utilities.skip-next', skipNext));
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

/* -------------------------------- Commands -------------------------------- */

function exchangeAnchorActive(){
    let editor = vscode.window.activeTextEditor;
    if(editor){
        editor.selections = editor.selections.map(sel =>
            new vscode.Selection(sel.active,sel.anchor)
        );
        let pos = editor.selection.active;
        editor.revealRange(new vscode.Range(pos,pos));
    }
}

function activeAtEnd(){
    let editor = vscode.window.activeTextEditor;
    if(editor){
        editor.selections = editor.selections.map(sel =>
            new vscode.Selection(sel.start,sel.end)
        );
        let pos = editor.selection.active;
        editor.revealRange(new vscode.Range(pos,pos));
    }
}

function activeAtStart(){
    let editor = vscode.window.activeTextEditor;
    if(editor){
        editor.selections = editor.selections.map(sel =>
            new vscode.Selection(sel.end,sel.start)
        );
        let pos = editor.selection.active;
        editor.revealRange(new vscode.Range(pos,pos));
    }
}

function movePrimaryLeft(){
    let editor = vscode.window.activeTextEditor;
    if(editor){
        primarySelection--;
        if(primarySelection < 0){
            primarySelection = editor.selections.length-1;
        }

        let pos = editor.selection.active;
        editor.revealRange(new vscode.Range(pos,pos));
        updateActiveSelection(editor, editor.selections);
    }
}

function movePrimaryRight(){
    let editor = vscode.window.activeTextEditor;
    if(editor){
        primarySelection++;
        if(primarySelection >= editor.selections.length){
            primarySelection = 0;
        }

        let pos = editor.selection.active;
        editor.revealRange(new vscode.Range(pos,pos));
        updateActiveSelection(editor, editor.selections);
    }
}

function appendToMemory(args: SelectMemoryArgs){
    let editor = vscode.window.activeTextEditor;
    if(editor){
        let memory = getSelectMemory(args);
        memory = memory.concat(curSelectionOrWord(editor));
        saveSelectMemory(memory,args,editor);
    }
}

function restoreAndClear(args: SelectMemoryArgs){
    let editor = vscode.window.activeTextEditor;
    if(editor){
        let memory = getSelectMemory(args);
        if(memory !== undefined){
            editor.selections = memory;
            primarySelection = 0;
            let pos = editor.selection.active;
            editor.revealRange(new vscode.Range(pos,pos));
            saveSelectMemory([],args,editor);
        }
    }
}

function swapWithMemory(args: SelectMemoryArgs){
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
}

function cancelSelection(){
    let editor = vscode.window.activeTextEditor;
    if(editor){
        if(primarySelection >= editor.selections.length){
            primarySelection = 0;
        }

        let pos = editor.selections[primarySelection].active;
        saveSelectMemory(editor.selections,{register: 'cancel'},editor);
        editor.selection = new vscode.Selection(pos,pos);
    }
}

function deleteLastSaved(args: SelectMemoryArgs){
    let editor = vscode.window.activeTextEditor;
    if(editor){
        let memory = getSelectMemory(args);
        memory.pop();
        saveSelectMemory(memory,args,editor);
    }
}

function deletePrimary(){
    let editor = vscode.window.activeTextEditor;
    if(editor){
        let sels = editor.selections;
        sels.splice(primarySelection,1);
        if(primarySelection >= sels.length){
            primarySelection = sels.length-1;
        }
        editor.selections = sels;
    }
}

async function addNext(){
    let editor = vscode.window.activeTextEditor;
    if(editor){
        let sel = curSelectionOrWord(editor);

        if(editor.selection.isEmpty){
            editor.selection = sel[0];
        }else{
            let sels = editor.selections;
            if(primarySelection >= editor.selections.length){
                primarySelection = 0;
            }

            editor.selection = editor.selections[primarySelection];
            await vscode.commands.
                executeCommand('editor.action.addSelectionToNextFindMatch');

            primarySelection = 0;
            let addme = editor.selections[1];
            sels.push(addme);
            sels.sort(compareSels);
            primarySelection = sels.findIndex(x => x.isEqual(addme));
            editor.selections = sels;
            let pos = sels[primarySelection].active;
            editor.revealRange(new vscode.Range(pos,pos));
            updateActiveSelection(editor, sels);
        }
    }
}


async function skipNext(){
    let editor = vscode.window.activeTextEditor;
    if(editor){
        let sel = curSelectionOrWord(editor);

        if(editor.selection.isEmpty){
            await vscode.commands.
                executeCommand('editor.action.moveSelectionToNextFindMatch');
        }else{
            let sels = editor.selections;
            if(primarySelection >= editor.selections.length){
                primarySelection = 0;
            }

            let oldPrimary = primarySelection;
            editor.selection = editor.selections[primarySelection];
            await vscode.commands.
                executeCommand('editor.action.addSelectionToNextFindMatch');

            primarySelection = oldPrimary;
            let addme = editor.selections[1];
            sels.splice(primarySelection,1,addme);
            sels.sort(compareSels);
            primarySelection = sels.findIndex(x => x.isEqual(addme));
            editor.selections = sels;
            let pos = sels[primarySelection].active;
            editor.revealRange(new vscode.Range(pos,pos));
        }
    }
}