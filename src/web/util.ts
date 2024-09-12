import * as vscode from 'vscode';

export interface IHash<T> {
    [details: string]: T;
}

export function compareSels(a: vscode.Selection, b: vscode.Selection) {
    const active = a.active.compareTo(b.active);
    if (active === 0) {
        return a.anchor.compareTo(b.anchor);
    } else {
        return active;
    }
}

export function wrappedTranslate(
    x: vscode.Position,
    doc: vscode.TextDocument,
    val: number
) {
    if (val < 0) {
        let result = x;
        while (result.character + val < 0 && result.line >= 0) {
            val += 1;
            result = result.translate(-1, 0);
            result = result.translate(0, doc.lineAt(result).range.end.character);
        }
        return result.translate(0, val);
    } else {
        let result = x;
        while (
            result.character + val > doc.lineAt(result).range.end.character &&
            result.line <= doc.lineCount + 1
        ) {
            val -= 1;
            result = new vscode.Position(result.line + 1, 0);
        }
        return result.translate(0, val);
    }
}

export function clampedLineTranslate(
    x: vscode.Position,
    doc: vscode.TextDocument,
    val: number
) {
    let newline = x.line + val;
    if (newline > doc.lineCount - 1) newline = doc.lineCount - 1;
    else if (newline < 0) newline = 0;
    return new vscode.Position(newline, 0);
}
