import * as vscode from 'vscode';
import { fromPosition, toPosition, toRange, type SyntaxNode, type Tree, type Cache as TreeCache } from './tree-sitter-api'
import { TreeCursor } from 'web-tree-sitter';
export type TreeSitter = typeof import('./tree-sitter-api');

// TODO: how to import API
let treeSitter: TreeSitter | undefined;
let treeCache: TreeCache | undefined;


function smallestSurroundingFilteredChild(filter: (x: SyntaxNode) => boolean, range: vscode.Range, cursor: TreeCursor): SyntaxNode | undefined {
    let node = cursor.currentNode
    let boundaries = toRange(node);
    if (!boundaries.contains(range)) {
        return undefined;
    }

    if (cursor.gotoFirstChildForPosition(fromPosition(range.start))) {
        node = cursor.currentNode;
        boundaries = toRange(node);
        let match = boundaries.contains(range) && filter(node)

        while (!match) {
            cursor.gotoNextSibling();
            node = cursor.currentNode;
            if (toPosition(node.startPosition) > range.start) {
                break;
            }
            boundaries = toRange(node);
            match = boundaries.contains(range) && filter(node)
        }

        if (match) {
            const maybeChildNode = smallestSurroundingFilteredChild(filter, range, cursor);
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

async function smallestSurroundingNode(filter: (x: SyntaxNode) => boolean, range: vscode.Range): Promise<SyntaxNode | undefined> {
    let editor = vscode.window.activeTextEditor;
    if(editor && treeSitter && treeCache) {
        // TODO: configure timeout??
        let tree = await treeSitter?.documentTree(editor.document, {cache: treeCache, timeoutMs: 2000});
        let node = smallestSurroundingFilteredChild(filter, range, tree.walk());
        if (node) {
            return node;
        } else {
            return tree.rootNode;
        }
    }
    return undefined;
}

// filters to be used for `smallestSurroundingNode`
function isNamed(x: SyntaxNode) {
    return x.isNamed;
}

function anyNode(x: SyntaxNode) {
    return true
}

function stepTo(named: boolean, pos: vscode.Range, stepper: (x: SyntaxNode) => SyntaxNode | null): vscode.Range | undefined {
    let node = await smallestSurroundingNode(named ? isNamed : anyNode, pos);
    if (node) {
        const nextNode = stepper(node);
        if (nextNode) {
            return toRange(nextNode)
        }
    }
    return undefined;
}

// STEPS:
// 1. find node using functions above
// 2. (lazy?) computation of boundary sequence
// 3. do we leverage untiMotions over this boundary sequence? (how do we deal with statefulness of cursors?)
// 3.b - implement expansions separately

export async function registerTreeSitter(context: vscode.ExtensionContext) {
    context.subscriptions.push(
        vscode.commands.registerCommand(
            'selection-utilities.selectNextNamedSibling',
            () => {
                const editor = vscode.window.activeTextEditor;
                if (editor) {
                    editor.selections = editor.selections.map(sel => {
                        const sib = stepTo(true, sel, node => node.nextNamedSibling);
                        if (sib) {
                            return new vscode.Selection(sib.start, sib.end);
                        } else {
                            return sel;
                        }
                    });
                }
        })
    );

    treeSitter = await vscode.extensions.getExtension<TreeSitter>(
        "gregoire.tree-sitter",
      )?.activate();
    if(treeSitter) {
        treeCache = new treeSitter.Cache();
    }
}
