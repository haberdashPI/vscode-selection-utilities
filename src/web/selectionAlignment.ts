import * as vscode from 'vscode';
import {updateView} from './selectionMemory';
import {compareSels} from './util';
import {cloneDeep} from 'lodash';

export function registerSelectionAlignments(context: vscode.ExtensionContext) {
    context.subscriptions.push(
        vscode.commands.registerCommand(
            'selection-utilities.alignSelectionsLeft',
            alignSelections
        )
    );
    context.subscriptions.push(
        vscode.commands.registerCommand(
            'selection-utilities.alignSelectionsRight',
            () => alignSelections(false)
        )
    );
}

interface AlignColumn {
    line: number;
    character: number;
    editCharacter: number;
    column: number;
    pad: number;
}

interface AlignRow {
    columns: AlignColumn[];
}

function characterPos(column: AlignColumn) {
    return column.editCharacter + column.pad;
}

function alignSelections(left: boolean = true) {
    const editor = vscode.window.activeTextEditor;
    if (editor) {
        let rows: AlignRow[] = [];
        const selections = (<vscode.Selection[]>(
            cloneDeep(editor.selections)
        )).sort(compareSels);
        let column = 0;
        let lastLine = -1;
        const i = 0;
        let totalColumns = 0;
        for (const sel of selections) {
            if (sel.active.line === lastLine) {
                column++;
                rows[rows.length - 1].columns.push({
                    line: sel.active.line,
                    character: sel.active.character,
                    editCharacter: sel.active.character,
                    column: column,
                    pad: 0,
                });
                totalColumns = Math.max(totalColumns, column + 1);
            } else {
                column = 0;
                rows.push({
                    columns: [
                        {
                            line: sel.end.line,
                            character: sel.start.character,
                            editCharacter: left
                                ? sel.start.character
                                : sel.end.character,
                            column: column,
                            pad: 0,
                        },
                    ],
                });
            }
            lastLine = sel.end.line;
            totalColumns = Math.max(totalColumns, column + 1);
        }

        for (column = 0; column < totalColumns; column++) {
            const maxchar = rows
                .map(x =>
                    column < x.columns.length
                        ? characterPos(x.columns[column])
                        : 0
                )
                .reduce((x, y) => Math.max(x, y));
            rows = rows.map(x => {
                if (column >= x.columns.length) {
                    return x;
                }

                const offset = maxchar - characterPos(x.columns[column]);
                // offset this character
                x.columns[column].pad += offset;
                // keep track of how this affects other columns in this row
                for (let c = column + 1; c < x.columns.length; c++) {
                    x.columns[c].editCharacter += offset;
                }
                return x;
            });
        }

        editor.edit((edit: vscode.TextEditorEdit) => {
            const i = 0;
            for (const row of rows) {
                for (const col of row.columns) {
                    edit.insert(
                        new vscode.Position(col.line, col.character),
                        ' '.repeat(col.pad)
                    );
                }
            }
        });
    }
}
