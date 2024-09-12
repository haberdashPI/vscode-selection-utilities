import * as vscode from 'vscode';

export interface TokenArgs {
    text?: string;
}

export function getInput(
    args: TokenArgs | undefined,
    message: string,
    validate: (str: string) => string | undefined
) {
    if (!args || !args.text) {
        return vscode.window.showInputBox({
            prompt: message,
            validateInput: validate,
        });
    } else {
        return Promise.resolve(args.text);
    }
}
