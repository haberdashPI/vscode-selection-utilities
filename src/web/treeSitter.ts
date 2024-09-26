import * as vscode from 'vscode';
import {
    fromPosition,
    toPosition,
    toRange,
    TreeSitter,
    type SyntaxNode,
    type Cache as TreeCache,
} from './tree-sitter-api';
// eslint-disable-next-line n/no-unpublished-import
import {TreeCursor} from 'web-tree-sitter';
import z from 'zod';
import {validateInput} from './util';
// TODO: something is up with this declaration, rexamine how
// to setup typing for tree-sitter-api
export type TreeSitter = typeof import('./tree-sitter-api');

let treeSitter: TreeSitter | undefined;
let treeCache: TreeCache | undefined;

function smallestSurroundingChild(
    range: vscode.Range,
    cursor: TreeCursor
): SyntaxNode | undefined {
    let node = cursor.currentNode;
    let boundaries = toRange(node);
    if (!boundaries.contains(range)) {
        return undefined;
    }

    if (cursor.gotoFirstChildForPosition(fromPosition(range.start))) {
        node = cursor.currentNode;
        boundaries = toRange(node);
        let match = boundaries.contains(range);

        while (!match) {
            cursor.gotoNextSibling();
            node = cursor.currentNode;
            if (toPosition(node.startPosition) > range.start) {
                break;
            }
            boundaries = toRange(node);
            match = boundaries.contains(range);
        }

        if (match) {
            const maybeChildNode = smallestSurroundingChild(range, cursor);
            if (maybeChildNode) {
                return maybeChildNode;
            } else {
                return node;
            }
        }
    }

    cursor.gotoParent();
    return undefined;
}

async function smallestSurroundingNode(
    document: vscode.TextDocument,
    range: vscode.Range
): Promise<SyntaxNode | undefined> {
    if (treeSitter && treeCache) {
        // TODO: configure timeout??
        const tree = await treeSitter?.documentTree(document, {
            cache: treeCache,
            timeoutMs: 2000,
        });
        const node = smallestSurroundingChild(range, tree.walk());
        if (node) {
            return node;
        } else {
            return tree.rootNode;
        }
    }
    return undefined;
}

// STEPS:
// 1. find node using functions above
// 2. (lazy?) computation of boundary sequence
// 3. do we leverage untiMotions over this boundary sequence? (how do we deal with statefulness of cursors?)
// 3.b - implement expansions separately

const moveBySyntaxArgs = z.object({
    unit: z.enum(['sibling', 'level']).optional(),
    select: z.boolean().optional().default(false),
    selectWhole: z.boolean().optional().default(false),
    named: z.boolean().optional().default(true),
    value: z.number().optional().default(1),
    boundary: z.enum(['start', 'end', 'both']),
});
type MoveBySyntaxArgs = z.output<typeof moveBySyntaxArgs>;
type SyntaxUnit = z.output<typeof moveBySyntaxArgs.shape.unit>;
// type SyntaxBoundary = z.output<typeof moveBySyntaxArgs.shape.boundary>;

function childStepper(cursor: TreeCursor, named: boolean): TreeCursor | null {
    let hasChild = cursor.gotoFirstChild();
    while (hasChild && !(cursor.currentNode.isNamed || !named)) {
        hasChild = cursor.gotoNextSibling();
    }
    if (hasChild) {
        return cursor;
    }
    return null;
}

function parentStepper(cursor: TreeCursor, named: boolean): TreeCursor | null {
    let hasParent = cursor.gotoParent();
    while (hasParent && !(cursor.currentNode.isNamed || !named)) {
        hasParent = cursor.gotoParent();
    }
    if (hasParent) {
        return cursor;
    }
    return null;
}

function nextStepper(cursor: TreeCursor, named: boolean): TreeCursor | null {
    let hasSibling = cursor.gotoNextSibling();
    while (hasSibling && !(cursor.currentNode.isNamed || !named)) {
        hasSibling = cursor.gotoNextSibling();
    }
    if (hasSibling) {
        return cursor;
    }
    return null;
}

function prevStepper(cursor: TreeCursor, named: boolean): TreeCursor | null {
    let hasSibling = cursor.gotoPreviousSibling();
    while (hasSibling && !(cursor.currentNode.isNamed || !named)) {
        hasSibling = cursor.gotoPreviousSibling();
    }
    if (hasSibling) {
        return cursor;
    }
    return null;
}

function stepper(
    unit: SyntaxUnit,
    forward: boolean,
    named: boolean
): (x: TreeCursor) => TreeCursor | null {
    if (unit === 'level') {
        if (forward) {
            return x => childStepper(x, named);
        } else {
            return x => parentStepper(x, named);
        }
    } else {
        // if (unit === 'sibling')
        if (forward) {
            return x => nextStepper(x, named);
        } else {
            return x => prevStepper(x, named);
        }
    }
}

function resolveCursor(
    start: vscode.Selection,
    from: vscode.Position,
    to: vscode.Position,
    args: MoveBySyntaxArgs
) {
    const {selectWhole, select, value} = args;
    const forward = value > 0;
    if (!selectWhole) {
        const anchor = select ? start.anchor : undefined;
        if (forward) {
            const pos = from.isBefore(to) ? to : from;
            return new vscode.Selection(anchor || pos, pos);
        } else {
            const pos = from.isBefore(to) ? from : to;
            return new vscode.Selection(anchor || pos, pos);
        }
    } else {
        const a = from.isBefore(to) ? from : to;
        const b = from.isBefore(to) ? to : from;
        if (forward) {
            return new vscode.Selection(a, b);
        } else {
            return new vscode.Selection(b, a);
        }
    }
}

async function stepTo(
    document: vscode.TextDocument,
    pos: vscode.Selection,
    args: MoveBySyntaxArgs
): Promise<vscode.Selection> {
    let node: SyntaxNode | undefined = undefined;
    const {named, value, boundary, unit, selectWhole} = args;

    if (selectWhole) {
        node = await smallestSurroundingNode(document, pos);
    } else {
        node = await smallestSurroundingNode(
            document,
            new vscode.Range(pos.active, pos.active)
        );
    }
    if (node) {
        const step = stepper(unit, value > 0, named);
        let stepsLeft = Math.abs(value) - 1;

        // if we have already highlighted the current node, we move to the next one
        // otherwise the first step of the motion is to highlight the current node
        if (!toRange(node).isEqual(pos)) {
            stepsLeft -= 1;
        }
        let cursor: TreeCursor | null = node.walk();
        let lastNode = cursor?.currentNode;

        // continue stepping, if necessary
        while (cursor !== null && stepsLeft > 0) {
            stepsLeft--;
            cursor = step(cursor);
            if (cursor?.currentNode) {
                lastNode = cursor?.currentNode;
            }
        }

        if (boundary === 'both' && lastNode) {
            const range = toRange(lastNode);
            return resolveCursor(pos, range.start, range.end, args);
        } else if (boundary === 'start' && lastNode) {
            const firstNode = lastNode;
            if (cursor) {
                cursor = step(cursor);
                if (cursor?.currentNode) {
                    lastNode = cursor?.currentNode;
                }
                if (lastNode && firstNode) {
                    const a = toPosition(firstNode.startPosition);
                    const b = toPosition(lastNode.startPosition);
                    return resolveCursor(pos, a, b, args);
                }
            }
            const end = firstNode.parent?.endPosition;
            if (end) {
                const a = toPosition(firstNode.startPosition);
                const b = toPosition(end);
                return resolveCursor(pos, a, b, args);
            }
        } else if (boundary === 'end' && lastNode) {
            const stepBack = stepper(unit, value <= 0, named);
            const firstNode = lastNode;
            if (cursor) {
                cursor = stepBack(cursor);
                if (cursor?.currentNode) {
                    lastNode = cursor?.currentNode;
                }
                if (lastNode && firstNode) {
                    const a = toPosition(firstNode.endPosition);
                    const b = toPosition(lastNode.endPosition);
                    return resolveCursor(pos, a, b, args);
                }
            }
            const start = firstNode?.startPosition;
            if (start) {
                const a = toPosition(firstNode.startPosition);
                const b = toPosition(start);
                return resolveCursor(pos, a, b, args);
            }
        }
    }
    return pos;
}

export async function registerTreeSitter(context: vscode.ExtensionContext) {
    context.subscriptions.push(
        vscode.commands.registerCommand(
            'selection-utilities.moveBySyntaxNode',
            async (args_: unknown) => {
                const args = validateInput('moveBySyntaxNode', args_, moveBySyntaxArgs);
                if (args) {
                    const editor = vscode.window.activeTextEditor;
                    if (editor) {
                        editor.selections = await Promise.all(
                            editor.selections.map(async sel => {
                                return await stepTo(editor.document, sel, args);
                            })
                        );
                    }
                }
            }
        )
    );

    // TODO: for this to work I think i need the extension to be a "ui" extension
    // (which *should* be okay) but this will require changing my webpack setup
    // to ignore node stuff
    const ext = vscode.extensions.getExtension<TreeSitter>('gregoire.tree-sitter');
    const _exts = vscode.extensions.all;
    let loaded = false;
    if (ext) {
        treeSitter = await ext.activate();
        if (treeSitter) {
            treeCache = new treeSitter.Cache();
            loaded = true;
        }
    }
    if (!loaded) {
        // TODO: add link button where extension can be installed
        vscode.window.showWarningMessage('Could not find `gregoire.tree-sitter`. ');
    }
}
