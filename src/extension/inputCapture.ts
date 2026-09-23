import * as vscode from 'vscode';
import z from 'zod';

export const tokenArgs = z.
    object({
        text: z.string().optional(),
    }).
    strict();

export type TokenArgs = z.infer<typeof tokenArgs>;

const regexString = () => z.string().superRefine((val, ctx) => {
    try {
        new RegExp(val);
    } catch (err) {
        ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: err instanceof Error ? err.message : 'Invalid regular expression',
        });
    }
});

export const regexTokenArgs = z.
    object({
        text: regexString().optional(),
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
