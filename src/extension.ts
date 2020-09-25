// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import { addListener } from 'cluster';
import { resolveAny } from 'dns';
import { ok } from 'assert';

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

function updateView(editor: vscode.TextEditor){
    let pos = getPrimarySelection(editor).active;
    editor.revealRange(new vscode.Range(pos,pos));
}

function updateActiveSelection(editor: vscode.TextEditor, sel: ReadonlyArray<vscode.Selection>){
    if(sel.length > 1){
        let prim = getPrimarySelection(editor)
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
    if(editor.selections.length === 1 && editor.selection.isEmpty){
        let range = editor.document.
            getWordRangeAtPosition(editor.selection.start);
        if(range !== undefined){
            return [new vscode.Selection(range.start,range.end)];
        }
    }
    return editor.selections;
}

function updateDecorators(event?: vscode.ConfigurationChangeEvent){
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

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {

    updateDecorators();
    vscode.workspace.onDidChangeConfiguration(updateDecorators);

    vscode.window.onDidChangeTextEditorSelection(e =>
        updateActiveSelection(e.textEditor,e.selections));

    context.subscriptions.push(vscode.commands.
        registerCommand('selection-utilities.exchangeAnchorActive', exchangeAnchorActive));
    context.subscriptions.push(vscode.commands.
        registerCommand('selection-utilities.activeAtEnd', activeAtEnd));
    context.subscriptions.push(vscode.commands.
        registerCommand('selection-utilities.activeAtStart', activeAtStart));
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
    context.subscriptions.push(vscode.commands.
        registerCommand('selection-utilities.includeBy', () => filterBy(true)));
    context.subscriptions.push(vscode.commands.
        registerCommand('selection-utilities.excludeBy', () => filterBy(false)));
    context.subscriptions.push(vscode.commands.
        registerCommand('selection-utilities.includeByRegex', () => filterBy(true,true)));
    context.subscriptions.push(vscode.commands.
        registerCommand('selection-utilities.excludeByRegex', () => filterBy(false,true)));
    context.subscriptions.push(vscode.commands.
        registerCommand('selection-utilities.alignSelectionsLeft', alignSelections));
    context.subscriptions.push(vscode.commands.
        registerCommand('selection-utilities.alignSelectionsRight', () => alignSelections(false)));
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

interface AlignColumn{
    line: number,
    character: number,
    editCharacter: number,
    column: number,
    pad: number,
}

interface AlignRow{
    columns: AlignColumn[],
}

function characterPos(column: AlignColumn){
    return column.editCharacter + column.pad;
}

function alignSelections(left: boolean = true){
    let editor = vscode.window.activeTextEditor;
    if(editor){
        let rows: AlignRow[] = [];
        let selections = editor.selections.sort(compareSels);
        let column = 0;
        let lastLine = -1;
        let i = 0;
        let totalColumns = 0;
        for(let sel of selections){
            if(sel.active.line === lastLine){
                column++;
                rows[rows.length-1].columns.push({
                    line: sel.active.line,
                    character: sel.active.character,
                    editCharacter: sel.active.character,
                    column: column,
                    pad: 0
                });
                totalColumns = Math.max(totalColumns,column+1);
            }else{
                column = 0;
                rows.push({columns: [{
                    line: sel.end.line,
                    character: sel.start.character,
                    editCharacter: left ? sel.start.character : sel.end.character,
                    column: column,
                    pad: 0
                }]});
            }
            lastLine = sel.end.line;
            totalColumns = Math.max(totalColumns,column+1);
        }

        for(column=0;column<totalColumns;column++){
            let maxchar = rows.
                map(x => column < x.columns.length ? characterPos(x.columns[column]) : 0).
                reduce((x,y) => Math.max(x,y));
            rows = rows.map(x => {
                if(column >= x.columns.length){ return x; }

                let offset = maxchar - characterPos(x.columns[column]);
                // offset this character
                x.columns[column].pad += offset;
                // keep track of how this affects other columns in this row
                for(let c = column+1; c<x.columns.length; c++){
                    x.columns[c].editCharacter += offset;
                }
                return x;
            });
        }

        editor.edit((edit: vscode.TextEditorEdit) => {
            let i = 0;
            for(let row of rows){
                for(let col of row.columns){
                    edit.insert(new vscode.Position(col.line,col.character),
                        ' '.repeat(col.pad));
                }
            }
        });
    }
}