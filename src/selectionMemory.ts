import * as vscode from 'vscode';
import { IHash, compareSels } from './util';

let activeSelectDecorator: vscode.TextEditorDecorationType;
let savedSelectDecorator: vscode.TextEditorDecorationType;
let primarySelectionIndex = 0;

function getPrimarySelectionIndex(editor: vscode.TextEditor){
    if(primarySelectionIndex >= editor.selections.length){
        primarySelectionIndex = editor.selections.length-1;
    }
    return primarySelectionIndex;
}

function getPrimarySelection(editor: vscode.TextEditor){
    return editor.selections[getPrimarySelectionIndex(editor)];
}

export function updateView(editor: vscode.TextEditor){
    let pos = getPrimarySelection(editor).active;
    editor.revealRange(new vscode.Range(pos,pos));
}

function updateActiveSelection(editor: vscode.TextEditor, sel: ReadonlyArray<vscode.Selection>){
    if(sel.length > 1){
        let prim = getPrimarySelection(editor);
        editor.setDecorations(
            activeSelectDecorator,
            [new vscode.Range(prim.start, prim.end)]
        );
    }else{
        editor.setDecorations( activeSelectDecorator, [] );
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

let selectionRegisters: IHash<vscode.Selection[]> = {};

interface SelectMemoryArgs{
    register?: string;
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
    if(editor.selections.length === 1 && editor.selection.isEmpty){
        let range = editor.document.
            getWordRangeAtPosition(editor.selection.start);
        if(range !== undefined){
            return [new vscode.Selection(range.start,range.end)];
        }
    }
    return editor.selections;
}

export function updateDecorators(event?: vscode.ConfigurationChangeEvent){
    if(!event || event.affectsConfiguration("selection-utilities")){
        let config = vscode.workspace.getConfiguration("selection-utilities");
        let primarySelectionColor = config.get<string>("primarySelectionColor");
        let savedSelectionColor = config.get<string>("savedSelectionColor");

        activeSelectDecorator = vscode.window.createTextEditorDecorationType({
            backgroundColor: primarySelectionColor
        });

        savedSelectDecorator = vscode.window.createTextEditorDecorationType({
            backgroundColor: savedSelectionColor
        });
    }
}

export function registerSelectionMemoryCommands(context: vscode.ExtensionContext){
    vscode.window.onDidChangeTextEditorSelection(e =>
        updateActiveSelection(e.textEditor,e.selections));

    context.subscriptions.push(vscode.commands.
        registerCommand('selection-utilities.movePrimaryLeft', movePrimaryLeft));
    context.subscriptions.push(vscode.commands.
        registerCommand('selection-utilities.movePrimaryRight', movePrimaryRight));
    context.subscriptions.push(vscode.commands.
        registerCommand('selection-utilities.focusPrimarySelection', focusPrimarySelection));
    context.subscriptions.push(vscode.commands.
        registerCommand('selection-utilities.appendToMemory',appendToMemory));
    context.subscriptions.push(vscode.commands.
        registerCommand('selection-utilities.restoreAndClear',restoreAndClear));
    context.subscriptions.push(vscode.commands.
        registerCommand('selection-utilities.swapWithMemory',swapWithMemory));
    context.subscriptions.push(vscode.commands.
        registerCommand('selection-utilities.cancelSelection',cancelSelection));
    context.subscriptions.push(vscode.commands.
        registerCommand('selection-utilities.deleteLastSaved',deleteLastSaved));
    context.subscriptions.push(vscode.commands.
        registerCommand('selection-utilities.deletePrimary', deletePrimary));
    context.subscriptions.push(vscode.commands.
        registerCommand('selection-utilities.addNext',addNext));
    context.subscriptions.push(vscode.commands.
        registerCommand('selection-utilities.skipNext', skipNext));
    context.subscriptions.push(vscode.commands.
        registerCommand('selection-utilities.addPrev',() => addNext(false)));
    context.subscriptions.push(vscode.commands.
        registerCommand('selection-utilities.skipPrev',() => skipNext(false)));
}


function movePrimaryLeft(){
    let editor = vscode.window.activeTextEditor;
    if(editor){
        primarySelectionIndex--;
        if(primarySelectionIndex < 0){
            primarySelectionIndex = Math.max(0,editor.selections.length-1);
        }

        updateView(editor);
        updateActiveSelection(editor, editor.selections);
    }
}

function movePrimaryRight(){
    let editor = vscode.window.activeTextEditor;
    if(editor){
        primarySelectionIndex++;
        if(primarySelectionIndex >= editor.selections.length){
            primarySelectionIndex = 0;
        }

        updateView(editor);
        updateActiveSelection(editor, editor.selections);
    }
}

function focusPrimarySelection(){
    let editor = vscode.window.activeTextEditor;
    if(editor){ updateView(editor); }
}

function appendToMemory(args: SelectMemoryArgs){
    let editor = vscode.window.activeTextEditor;
    if(editor){
        let memory = getSelectMemory(args);
        memory = memory.concat(curSelectionOrWord(editor));
        saveSelectMemory(memory,args,editor);

        editor.selection = getPrimarySelection(editor);
    }
}

function restoreAndClear(args: SelectMemoryArgs){
    let editor = vscode.window.activeTextEditor;
    if(editor){
        let memory = getSelectMemory(args);
        if(memory !== undefined && memory.length > 0){
            let prim = getPrimarySelection(editor);
            primarySelectionIndex = findClosestIndex(memory,prim);
            editor.selections = memory;
            updateView(editor);
            saveSelectMemory([],args,editor);
        }
    }
}

function findClosestIndex(sels: vscode.Selection[], x: vscode.Selection){
    let sameLineIndices = sels.
        map((y,i) => y.active.line === x.active.line ? i : -1).
        filter(x => x > 0);
    if(sameLineIndices.length === 0){
        let mindist = Number.MAX_VALUE;
        let index = 0;

        for(let i=0;i<sels.length;i++){
            let dist = Math.abs(sels[i].active.line - x.active.line);
            if(mindist > dist){
                mindist = dist;
                index = i;
            }
        }
        return index;
    }else{
        let mindist = Number.MAX_VALUE;
        let index = 0;

        for(let i of sameLineIndices){
            let dist = Math.abs(sels[i].active.character - x.active.character);
            if(mindist > dist){
                mindist = dist;
                index = i;
            }
        }
        return index;
    }
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
    if(editor && editor.selections.length > 0){
        let pos = getPrimarySelection(editor).active;
        saveSelectMemory(editor.selections,{register: 'cancel'},editor);
        editor.selection = new vscode.Selection(pos,pos);
    }
}

function deleteLastSaved(args: SelectMemoryArgs){
    let editor = vscode.window.activeTextEditor;
    if(editor){
        let memory = getSelectMemory(args,false);
        memory.pop();
        saveSelectMemory(memory,args,editor);
    }
}

function deletePrimary(){
    let editor = vscode.window.activeTextEditor;
    if(editor && editor.selections.length > 1){
        if(editor.selections.length > 1){
            let sels = editor.selections;
            let prim = getPrimarySelectionIndex(editor);
            sels.splice(prim,1);
            editor.selections = sels;
        }else{
            let pos = editor.selection.active;
            editor.selection = new vscode.Selection(pos,pos);
        }
        updateView(editor);
    }
}


async function addNext(next: boolean = true){
    let editor = vscode.window.activeTextEditor;
    if(editor){
        let sel = curSelectionOrWord(editor);

        if(editor.selection.isEmpty){
            editor.selection = sel[0];
        }else{
            let sels = editor.selections;
            editor.selection = getPrimarySelection(editor);
            if(next){
                await vscode.commands.
                    executeCommand('editor.action.addSelectionToNextFindMatch');
            }else{
                await vscode.commands.
                    executeCommand('editor.action.addSelectionToPreviousFindMatch');
            }

            if(editor.selections.length > 1){
                let addme = editor.selections[1];
                sels.push(addme);
                sels.sort(compareSels);
                primarySelectionIndex = sels.findIndex(x => x.isEqual(addme));
            }
            editor.selections = sels;
            updateView(editor);
            updateActiveSelection(editor, sels);
        }
    }
}


async function skipNext(next: boolean = true){
    let editor = vscode.window.activeTextEditor;
    if(editor){
        if(editor.selections.length <= 1){
            if(next){
                await vscode.commands.
                    executeCommand('editor.action.moveSelectionToNextFindMatch');
            }else{
                await vscode.commands.
                    executeCommand('editor.action.moveSelectionToPreviousFindMatch');
            }
        }else{
            let sels = editor.selections;
            let oldPrimary = getPrimarySelectionIndex(editor);
            editor.selection = editor.selections[oldPrimary];
            if(next){
                await vscode.commands.
                    executeCommand('editor.action.addSelectionToNextFindMatch');
            }else{
                await vscode.commands.
                    executeCommand('editor.action.addSelectionToPreviousFindMatch');
            }
            if(editor.selections.length >= 1){
                let addme = editor.selections[1];
                sels.splice(oldPrimary,1,addme);
                sels.push(addme);
                sels.sort(compareSels);
                primarySelectionIndex = sels.findIndex(x => x.isEqual(addme));
            }
            editor.selections = sels;
            updateView(editor);
        }
    }
}
