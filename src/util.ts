import * as vscode from 'vscode';

export interface IHash<T> {
    [details: string]: T;
}

export function compareSels(a: vscode.Selection, b: vscode.Selection){
    let active = a.active.compareTo(b.active);
    if(active === 0){
        return a.anchor.compareTo(b.anchor);
    }else{
        return active;
    }
}
