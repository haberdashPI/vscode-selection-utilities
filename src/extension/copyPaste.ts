// import * as vscode from 'vscode';

// let pasteRegisters: Record<string, { content: string, fullLine: boolean }[]> = {}

// function copyToRegister(args: { register: string } = { register: "default" }){
//     let editor = vscode.window.activeTextEditor;
//     if(editor){
//         let ed = editor;
//         pasteRegisters[args.register] = editor.selections.map(s => {
//             return ed.document.getText(s);
//         })
//         vscode.env.clipboard.writeText(pasteRegisters[args.register][0]);
//     }
// }

// function isMultiLine(str: string){
//     return /(\n|\r\n|\n\r)/.test(str);
// }

// async function pasteFromRegister(args: { register: string, at: "before" | "after" } =
//                                        { register: "default", at: "after" }){
//     let editor = vscode.window.activeTextEditor;
//     let after = args.at === "after";
//     if(editor){
//         let ed = editor;
//         if(args.register === "default"){
//             pasteRegisters[args.register][0] = await vscode.env.clipboard.readText();
//         }
//         editor.edit(builder => {
//             for(let [i, sel] of ed.selections.entries()){
//                 let selContents = ed.document.getText(sel);
//                 let clipContents = pasteRegisters[args.register][i];
//                 if(!isMultiLine(clipContents)){
//                     builder.insert(after ? sel.end : sel.start, clipContents);
//                 }else{
//                     if(!isMultiLine(clipContents))
//                 }
//             }
//         })
//     }
// }
