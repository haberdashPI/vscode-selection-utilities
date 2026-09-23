import * as vscode from 'vscode';
import z from 'zod';

export const tokenArgs = z.
    object({
        text: z.string().optional(),
    }).
    strict();

export type TokenArgs = z.infer<typeof tokenArgs>;

export const regexTokenArgs = z.
    object({
        text: z.
            string().
            refine(
                (val) => {
                    try {
                        new RegExp(val);
                        return true;
                    } catch {
                        return false;
                    }
                },
                { message: 'Invalid regular expression' },
            ).
            optional(),
    }).
    strict();

export type RegexTokenArgs = z.infer<typeof regexTokenArgs>;

export function getInput(
    args: TokenArgs | RegexTokenArgs | undefined,
    message: string,
    validate: (str: string) => string | undefined,
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
