import * as vscode from 'vscode';

let reflectionDectorator: vscode.TextEditorDecorationType;
let reflectionRegion: vscode.Selection[] = [];
let typeEvent: vscode.Disposable | undefined;
function setReflection(select: vscode.Selection[]){
    let editor = vscode.window.activeTextEditor;
    if(editor){
        reflectionRegion = editor.selections;
        editor.setDecorations(
            reflectionDectorator,
            reflectionRegion.map(x => new vscode.Range(x.start, x.end))
        );
    }
}

function clearReflection(){
    reflectionRegion = [];
    let editor = vscode.window.activeTextEditor;
    if(editor){
        editor.setDecorations(reflectionDectorator, []);
    }
}

async function onReflectType(event: { text: string }){
    let editor = vscode.window.activeTextEditor;
    if(editor){
        // TODO: check to see if
        // 1. the text matches one of the reflecting characters
        // 2. find each cursor that is located at a reflection point
        editor.edit((edit: vscode.TextEditorEdit) => {
            // TODO: then, reflect the character if conditions matched
        })
    }
    // TODO: if none of the conditions matched, just pass through to default event
    return await vscode.commands.executeCommand('default:type', { text });
}

// TODO: overall plan --- a call to request reflection creates cursors at
// the start and end of selections. In most cases this works like normal
// (though the regions between cursors stay highlighted to make it clear
// things are different); however particular keystorkes lead to reflected
// values (i.e. `(` becomes `)` at the paired cursor)

