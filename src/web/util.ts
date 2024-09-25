import * as vscode from 'vscode';
import z, {ZodError, ZodIssue} from 'zod';
import {fromZodError, fromZodIssue} from 'zod-validation-error';

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

export function validateInput<T, Def extends z.ZodTypeDef, I>(
    command: string,
    args_: unknown,
    using: z.ZodType<T, Def, I>
): T | undefined {
    const result = using.safeParse(args_);
    if (!result.success) {
        showParseError(`'${command}' `, result.error);
        return;
    }
    return result.data;
}

export async function showParseError(prefix: string, error: ZodError | ZodIssue) {
    let suffix = '';
    if ((<ZodIssue>error).code === undefined) {
        // code is always defined on issues and undefined on errors
        suffix = fromZodError(<ZodError>error).message;
    } else {
        suffix = fromZodIssue(<ZodIssue>error).message;
    }
    const buttonPattern = /\s+\{button:\s*"(.+)(?<!\\)",\s*link:(.+)\}/;
    const match = suffix.match(buttonPattern);
    if (
        match !== null &&
        match.index !== undefined &&
        match[1] !== undefined &&
        match[2] !== undefined
    ) {
        suffix =
            suffix.slice(0, match.index) + suffix.slice(match.index + match[0].length, -1);
        const button = match[1];
        const link = match[2];
        const pressed = await vscode.window.showErrorMessage(prefix + suffix, button);
        if (button === pressed) {
            vscode.env.openExternal(vscode.Uri.parse(link));
        }
    } else {
        vscode.window.showErrorMessage(prefix + suffix);
    }
}
