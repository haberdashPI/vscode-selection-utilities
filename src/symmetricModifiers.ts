import * as vscode from 'vscode';

export function registerSymmetricModifiers(context: vscode.ExtensionContext){
    context.subscriptions.push(vscode.commands.
        registerCommand('selection-utilities.insertAround', insertAround));
    context.subscriptions.push(vscode.commands.
        registerCommand('selection-utilities.deleteAround', deleteAround));
    context.subscriptions.push(vscode.commands.
        registerCommand('selection-utilities.adjustSelections', adjustSelections));
}

interface InsertAroundArgs{
    before: string,
    after: string
}

function wrappedTranslate(x: vscode.Position, doc: vscode.TextDocument, val: number){
    if(val < 0){
        let result = x
        while(result.character + val < 0){
            val += 1;
            result = result.translate(-1, 0);
            result = result.translate(0, doc.lineAt(result).range.end.character)
        }
        return result.translate(0, val);
    }else{
        let result = x;
        while(result.character + val > doc.lineAt(result).range.end.character){
            val -= 1;
            result = new vscode.Position(result.line+1, 0)
        }
        return result.translate(0, val);
    }
}

async function insertAround(args: InsertAroundArgs){
    let editor = vscode.window.activeTextEditor;
    if(editor){
        let ed = editor;
        let ranges = editor.selections.map(sel => 
        new vscode.Range(sel.start, sel.end));

        await editor.edit(builder => {
            for(const r of ranges){
                builder.insert(r.start, args.before);
                builder.insert(r.end, args.after);
            }
        });

        editor.selections = editor.selections.map(sel => {
            if(!sel.isReversed){
                return new vscode.Selection(
                    sel.anchor,
                    wrappedTranslate(sel.active, ed.document, -1),
                );
            }else{
                return new vscode.Selection(
                    wrappedTranslate(sel.anchor, ed.document, -1),
                    sel.active
                );
            }
        });
    }
}

function deleteAround(args: {count?: number }){
    let editor = vscode.window.activeTextEditor;
    if(editor){
        let ed = editor;
        editor.edit(builder => {
            for(const sel of ed.selections){
                builder.delete(new vscode.Range(
                    wrappedTranslate(sel.start, ed.document, -(args.count || 1)), 
                    sel.start)
                );
                builder.delete(new vscode.Range(
                    sel.end, 
                    wrappedTranslate(sel.end, ed.document, (args.count || 1)))
                );
            }
        });
    }
}


function adjustSelections(args: {dir: string, count: number}){
    let editor = vscode.window.activeTextEditor;
    let step = args.dir === 'forward' ? (args.count || 1) : -(args.count || 1);
    if(editor){
        let ed = editor;
        editor.selections = editor.selections.map(sel => {
            let sign = sel.isReversed ? -1 : 1;
            return new vscode.Selection(
                wrappedTranslate(sel.anchor, ed.document, -sign*step),
                wrappedTranslate(sel.active, ed.document,  sign*step)
            );
        });
    }
}