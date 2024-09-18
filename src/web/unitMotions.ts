import * as vscode from 'vscode';
import {updateView} from './selectionMemory';
import {clampedLineTranslate, IHash} from './util';
import {cloneDeep} from 'lodash';

interface MoveByArgs {
    unit?: string;
    select?: boolean;
    selectWhole?: boolean;
    selectOneUnit?: boolean;
    value?: number;
    boundary?: string;
}

interface NarrowByArgs {
    unit?: string;
    then?: string;
    thenBoundary?: string;
    boundary?: string;
}

interface UnitDef {
    name: string;
    regex: string;
}

interface MultiUnitDef {
    name: string;
    regexs: string | string[];
}

interface MultiLineUnit {
    regexs: RegExp[];
}

const allUnits: IHash<IHash<RegExp | MultiLineUnit>> = {};

const defaultUnits = ['subword', 'word', 'WORD', 'paragraph', 'section', 'subsection'];

export function updateUnits(event?: vscode.ConfigurationChangeEvent, newid?: string) {
    if (!event || event.affectsConfiguration('selection-utilities')) {
        const ids = Object.keys(allUnits);
        ids.push('[GENERIC]');
        newid !== undefined && ids.push(newid);
        for (const id of ids) {
            let config;
            if (id !== '[GENERIC]') {
                config = vscode.workspace.getConfiguration('selection-utilities', {
                    languageId: id,
                });
            } else {
                config = vscode.workspace.getConfiguration('selection-utilities');
            }
            const newUnits = config.get<Array<UnitDef | MultiUnitDef>>('motionUnits');
            const units: IHash<RegExp | MultiLineUnit> = {};
            if (newUnits) {
                for (const unit of newUnits) {
                    if ((unit as UnitDef).regex) {
                        units[unit.name] = RegExp((unit as UnitDef).regex, 'gu');
                    } else if ((unit as MultiUnitDef).regexs) {
                        const unitdef = unit as MultiUnitDef;
                        let regexs: string[];
                        if (unitdef.regexs instanceof Array) {
                            regexs = unitdef.regexs as string[];
                        } else {
                            regexs = [unitdef.regexs as string];
                        }
                        units[unit.name] = {
                            regexs: regexs.map(x => RegExp(x, 'u')),
                        };
                    } else {
                        vscode.window.showErrorMessage('Malformed unit definition');
                    }
                }
            }
            allUnits[id] = units;
        }
    }
}

export function registerUnitMotions(context: vscode.ExtensionContext) {
    let command = vscode.commands.registerCommand(
        'selection-utilities.moveBy',
        (args: MoveByArgs) => {
            const editor = vscode.window.activeTextEditor;
            if (editor) {
                editor.selections = editor.selections.map(moveBy(editor, args));
                updateView(editor);
            }
        }
    );
    context.subscriptions.push(command);

    command = vscode.commands.registerCommand(
        'selection-utilities.narrowTo',
        (args: NarrowByArgs) => {
            const editor = vscode.window.activeTextEditor;
            if (editor) {
                editor.selections = editor.selections.map(narrowTo(editor, args));
                updateView(editor);
            }
        }
    );
    context.subscriptions.push(command);

    for (const unit of defaultUnits) {
        for (const dir of ['Next', 'Previous']) {
            for (const selType of ['moveCursorTo', 'moveTo', 'selectTo']) {
                const unitLabel = unit.charAt(0).toUpperCase() + unit.slice(1);
                // console.log("unitLabel: ")
                // console.log(unitLabel)
                const args = {
                    unit: unit,
                    select: selType !== 'moveCursorTo',
                    selectWhole: selType === 'moveTo',
                    value: dir === 'Next' ? 1 : -1,
                    boundary: 'start',
                };
                const commandName = selType + dir + unitLabel;
                command = vscode.commands.registerCommand(
                    'selection-utilities.' + commandName,
                    _ => {
                        const editor = vscode.window.activeTextEditor;
                        if (editor) {
                            editor.selections = editor.selections.map(moveBy(editor, args));
                            updateView(editor);
                        }
                    }
                );
                context.subscriptions.push(command);
            }
        }
    }
}

interface Range {
    start?: vscode.Position;
    end?: vscode.Position;
}

function* singleLineUnitsForDoc(
    doc: vscode.TextDocument,
    start: vscode.Position,
    unit: RegExp,
    wrapAround: boolean,
    forwards: boolean
) {
    let offset: number | undefined = start.character;
    for (const [line, i] of linesOf(doc, start, wrapAround || false, forwards)) {
        const matchesItr = regexMatches(unit, line, forwards, offset);
        const matches = forwards ? matchesItr : Array.from(matchesItr).reverse();

        yield* mapIter(matches, ([start, len]) => {
            return {
                start: new vscode.Position(i, start),
                end: new vscode.Position(i, start + len),
            };
        });
        // end/start of document boundaries
        if (i >= doc.lineCount - 1 && forwards) {
            const last = lastPosition(doc);
            yield {
                start: last,
                end: last,
            };
        } else if (i === 0 && !forwards) {
            const first = new vscode.Position(0, 0);
            yield {
                start: first,
                end: first,
            };
        }
        offset = undefined;
    }
}

function* linesOf(
    doc: vscode.TextDocument,
    pos: vscode.Position,
    wrap: boolean,
    forward: boolean
): Generator<[string, number]> {
    yield [doc.lineAt(pos).text, pos.line];
    let line = pos.line + (forward ? 1 : -1);
    while (forward ? line < doc.lineCount : line >= 0) {
        yield [doc.lineAt(line).text, line];
        line += forward ? 1 : -1;
    }
    if (wrap) {
        line = forward ? 0 : doc.lineCount - 1;
        while (forward ? line < doc.lineCount : line > 0) {
            yield [doc.lineAt(line).text, line];
            line += forward ? 1 : -1;
        }
    }
}

function* regexMatches(
    matcher_: RegExp,
    line: string,
    forward: boolean,
    offset: number | undefined
): Generator<[number, number]> {
    const matcher = cloneDeep(matcher_);
    matcher.lastIndex = 0;
    let match = matcher.exec(line);
    while (match) {
        if (offset !== undefined && !forward && match.index > offset) {
            return;
        }
        if (offset === undefined || !forward || match.index + match[0].length > offset)
            yield [match.index, match[0].length];
        const newmatch = matcher.exec(line);
        if (newmatch && newmatch.index > match.index) {
            match = newmatch;
        } else {
            match = null;
        }
    }
}

function* mapIter<T, R>(iter: Iterable<T>, fn: (x: T) => R) {
    for (const x of iter) {
        yield fn(x);
    }
}

type Unit = RegExp | MultiLineUnit | string[];
function unitsForDoc(
    document: vscode.TextDocument,
    from: vscode.Position,
    unit: Unit,
    forward: boolean
): Generator<Range> {
    if (unit instanceof RegExp) {
        return singleLineUnitsForDoc(document, from, unit, false, forward);
    } else {
        return multiLineUnitsForDoc(document, from, unit as MultiLineUnit, forward);
    }
}

export function popFirst<T>(x: Iterable<T>): T | undefined {
    const itr: Iterator<T> = x[Symbol.iterator]();
    const result: IteratorResult<T, T> = itr.next();
    if (!result.done) {
        return result.value;
    } else {
        return undefined;
    }
}

enum Boundary {
    Start,
    End,
    Both,
}

function* docLines(
    document: vscode.TextDocument,
    from: vscode.Position,
    forward: boolean
): Generator<[number, string]> {
    yield [from.line, document.lineAt(from).text];
    if (forward) {
        while (from.line + 1 < document.lineCount) {
            from = new vscode.Position(from.line + 1, 0);
            yield [from.line, document.lineAt(from).text];
        }
    } else {
        while (from.line > 0) {
            from = new vscode.Position(from.line - 1, 0);
            yield [from.line, document.lineAt(from).text];
        }
    }
}

function* singleRegexUnitsForDoc(
    document: vscode.TextDocument,
    from: vscode.Position,
    unit: MultiLineUnit,
    forward: boolean
) {
    let first_match: undefined | null | number = undefined;
    function closeMatch(line: number) {
        if (first_match !== undefined) {
            const startLine: null | number = forward ? first_match : line + 1;
            const endLine: null | number = forward ? line - 1 : first_match;
            let endCol: null | number = null;
            if (endLine !== null) {
                endCol = document.lineAt(new vscode.Position(endLine, 0)).range.end
                    .character;
            }
            return {
                start: startLine !== null ? new vscode.Position(startLine, 0) : undefined,
                end:
                    endLine !== null && endCol !== null
                        ? new vscode.Position(endLine, endCol)
                        : undefined,
            };
        }
        return undefined;
    }
    let first = true;
    for (const [line, text] of docLines(document, from, forward)) {
        if (unit.regexs[0].test(text)) {
            if (first) {
                // if the very first line matches, the `from` position could
                // fall in the middle of a sequence of matching lines we
                // represent the fact that we dont' know where this sequence
                // starts using `null`
                first_match = null;
            } else if (first_match === undefined) {
                first_match = line;
            }
        } else {
            const result = closeMatch(line);
            if (result !== undefined) {
                first_match = undefined;
                yield result;
            }
        }
        first = false;
    }
    const result = closeMatch(forward ? document.lineCount : -1);
    if (result !== undefined) yield result;
}

function* multiRegexUnitsForDoc(
    document: vscode.TextDocument,
    from: vscode.Position,
    unit: MultiLineUnit,
    forward: boolean
) {
    const buffer: [number, string][] = [];
    let doesMatch;
    if (forward) {
        doesMatch = (unit: MultiLineUnit, buffer: [number, string][]) => {
            return unit.regexs.every((x, i) => x.test(buffer[i][1]));
        };
    } else {
        doesMatch = (unit: MultiLineUnit, buffer: [number, string][]) => {
            return unit.regexs.every((x, i) => x.test(buffer[buffer.length - (i + 1)][1]));
        };
    }

    const start_from = clampedLineTranslate(from, document, -unit.regexs.length + 1);
    for (const [line, text] of docLines(document, start_from, forward)) {
        buffer.push([line, text]);
        if (buffer.length > unit.regexs.length) {
            buffer.shift();
        }
        if (buffer.length === unit.regexs.length) {
            if (doesMatch(unit, buffer)) {
                const startLine = forward ? buffer[0][0] : buffer[buffer.length - 1][0];
                const endLine = !forward ? buffer[0][0] : buffer[buffer.length - 1][0];
                const endCol = document.lineAt(endLine).range.end.character;
                yield {
                    start: new vscode.Position(startLine, 0),
                    end: new vscode.Position(endLine, endCol),
                };
            }
        }
    }
}

function* multiLineUnitsForDoc(
    document: vscode.TextDocument,
    from: vscode.Position,
    unit: MultiLineUnit,
    forward: boolean
): Generator<Range> {
    if (unit.regexs.length > 1) {
        yield* multiRegexUnitsForDoc(document, from, unit, forward);
    } else {
        yield* singleRegexUnitsForDoc(document, from, unit, forward);
    }
}

function unitNameToRegex(editor: vscode.TextEditor, name?: string) {
    const id = editor.document?.languageId || '[GENERIC]';
    if (allUnits[id] === undefined) {
        updateUnits(undefined, id);
    }
    return name === undefined
        ? /\p{L}+/gu
        : allUnits[id] === undefined
          ? allUnits['[GENERIC]'][name]
          : allUnits[id][name] || allUnits['[GENERIC]'][name];
}

function toBoundary(args: {boundary?: string}) {
    if (args.boundary === undefined) {
        return Boundary.Start;
    } else if (args.boundary === 'start') {
        return Boundary.Start;
    } else if (args.boundary === 'end') {
        return Boundary.End;
    } else if (args.boundary === 'both') {
        return Boundary.Both;
    } else {
        vscode.window.showErrorMessage(
            "Unexpected value for boundary argument: '" + args.boundary + "'."
        );
        return undefined;
    }
}

// this handles unit cleanup when looking for two boundaries: when you look for units in one
// direction sometime you miss the start (or end) of a unit you're in the middle of (for
// multi-line units in particular). If we want to resolve the boundaries of a unit, we need
// to look backwards from the starting position.
function* resolveUnitBoundaries(
    resolve: Boundary | undefined,
    units: Generator<Range>,
    document: vscode.TextDocument,
    from: vscode.Position,
    unit: Unit,
    forward: boolean
): Generator<Range> {
    function* resolveHelper(firstUnit: Range, back: Range): Generator<Range> {
        if (resolve === Boundary.Start && (!firstUnit?.start || !forward)) {
            yield back;
            yield firstUnit;
        } else if (resolve === Boundary.End && (!firstUnit?.end || forward)) {
            yield back;
            yield firstUnit;
        } else if (!firstUnit?.start || !firstUnit?.end) {
            if (back.start && back.end) {
                yield back;
            } else if (back.start && firstUnit?.end) {
                yield {start: back.start, end: firstUnit.end};
            } else if (back.end && firstUnit?.start) {
                yield {start: firstUnit.start, end: back.end};
            }
        } else {
            yield firstUnit;
        }
    }

    // TODO: this is where I'm currently stumped
    const firstUnit = popFirst(units);
    if (!firstUnit) {
        return;
    } else {
        const backwards = unitsForDoc(document, from, unit, !forward);
        let back = popFirst(backwards);
        while (boundsMatch(back, firstUnit)) {
            back = popFirst(backwards);
        }
        if (back) {
            yield* resolveHelper(firstUnit, back);
        }
        yield* units;
    }
}

function lastPosition(document: vscode.TextDocument) {
    const last = document.lineCount - 1;
    const endCol = document.lineAt(last).range.end.character;
    return new vscode.Position(last, endCol);
}

function moveBy(editor: vscode.TextEditor, args: MoveByArgs) {
    const unit = unitNameToRegex(editor, args.unit);
    const forward = args.value === undefined ? true : args.value > 0;
    const holdSelect = args.select === undefined ? false : args.select;
    const selectWholeUnit = args.selectWhole === undefined ? false : args.selectWhole;
    const selectOneUnit = args.selectOneUnit;

    const boundary = toBoundary(args);
    if (boundary === undefined) {
        return (sel: vscode.Selection) => sel;
    }
    const steps = args.value === undefined ? 1 : Math.abs(args.value);
    if (steps === 0) {
        return (select: vscode.Selection) => select;
    }

    // translate a sequence of units (regex start and stop boundaries)
    // to a sequence of selection points (where we extend the active selection
    // point to a new unit boundary at each step)
    function* selectBoundaries(xs: Generator<Range>, start: vscode.Position | undefined) {
        function withStart(x: vscode.Position) {
            if (start) return new vscode.Selection(start, x);
            else return new vscode.Selection(x, x);
        }
        for (const x of xs) {
            if (boundary === Boundary.Start) {
                if (x.start) yield withStart(x.start);
            } else if (boundary === Boundary.End) {
                if (x.end) yield withStart(x.end);
            } else {
                if (x.start) yield withStart(x.start);
                if (x.end) yield withStart(x.end);
            }
        }
    }

    // translate a sequence of units (regex start and stop boundaries)
    // to a sequence of selections: the selections surround a single
    // unit around from start-to-start, end-to-end or start-to-end
    function* selectUnits(xs: Generator<Range>) {
        if (boundary === Boundary.Both) {
            for (const x of xs) {
                if (x.start && x.end) {
                    yield new vscode.Selection(x.start, x.end);
                }
            }
        } else {
            let last: vscode.Position | undefined = undefined;
            let current: vscode.Position | undefined = undefined;
            for (const x of xs) {
                last = current;
                if (boundary === Boundary.Start) {
                    current = x.start;
                } else {
                    current = x.end;
                }
                if (current !== undefined && last !== undefined) {
                    yield new vscode.Selection(last, current);
                }
            }
        }
    }

    // return a function that modifies each selection in turn
    // (it will be applied to all selections)
    return (select: vscode.Selection) => {
        const units = unitsForDoc(editor.document, select.active, unit, forward);
        let selections;
        if (selectWholeUnit) {
            // if we are selecting whole units we need to use `resolveUnitBoundaries`
            // to look possibly backwards from the starting position to resolve
            // the start of a unit
            const resolved = resolveUnitBoundaries(
                boundary,
                units,
                editor.document,
                select.active,
                unit,
                forward
            );
            selections = selectUnits(resolved);
        } else {
            selections = selectBoundaries(units, holdSelect ? select.anchor : undefined);
        }
        let count = 0; // how many selections have we advanced?
        let lastsel;
        let startSel: vscode.Position | undefined = undefined;
        for (const sel of selections) {
            if (count > 0 || !boundsMatch(sel, select)) {
                if (forward && sel.end.isAfter(select.active)) {
                    count += 1;
                } else if (!forward && sel.start.isBefore(select.active)) {
                    count += 1;
                }
                if (count === 1) {
                    startSel = sel.anchor;
                }
            }
            if (count >= steps) {
                // do we need the selection to start from the first selection region?
                if (!selectOneUnit && startSel && selectWholeUnit) {
                    return new vscode.Selection(startSel, sel.active);
                } else {
                    return sel;
                }
            }
            lastsel = sel;
        }
        if (count > 0 && lastsel) {
            if (!selectOneUnit && startSel) {
                return new vscode.Selection(startSel, lastsel.active);
            } else {
                return lastsel;
            }
        }
        return select;
    };
}

function boundsMatch(x: Range | undefined, y: Range | undefined) {
    let startEqual = false;
    if (x?.start === undefined && y?.start === undefined) {
        startEqual = true;
    } else if (x?.start && y?.start) {
        startEqual = x?.start.isEqual(y.start);
    }

    let endEqual = false;
    if (x?.end === undefined && y?.end === undefined) {
        endEqual = true;
    } else if (x?.end && y?.end) {
        endEqual = x?.end.isEqual(y.end);
    }

    return startEqual && endEqual;
}

function narrowTo(
    editor: vscode.TextEditor,
    args: NarrowByArgs
): (select: vscode.Selection) => vscode.Selection {
    const unit = unitNameToRegex(editor, args.unit);
    const thenNarrow =
        args.then === undefined
            ? undefined
            : narrowTo(editor, {
                  unit: args.then,
                  boundary:
                      args.thenBoundary === undefined ? args.boundary : args.thenBoundary,
              });

    const boundary = toBoundary(args);
    if (boundary === undefined) {
        return (sel: vscode.Selection) => sel;
    }

    return (select: vscode.Selection) => {
        if (select.anchor.isEqual(select.active)) {
            return select;
        }
        const starts = unitsForDoc(editor.document, select.start, unit, true);
        let start: vscode.Position | undefined;
        for (const s of starts) {
            if (s.start?.isAfterOrEqual(select.end)) break;
            if (s.start?.isAfterOrEqual(select.start)) {
                start = s.start;
                break;
            }
        }
        const stops = unitsForDoc(editor.document, select.end, unit, false);
        let stop: vscode.Position | undefined;
        for (const s of stops) {
            if (s.end?.isBeforeOrEqual(select.start)) break;
            if (s.end?.isBeforeOrEqual(select.end)) {
                stop = s.end;
                break;
            }
        }
        if (!stop || !start) {
            if (thenNarrow) {
                return thenNarrow(select);
            }
            return select;
        }
        if (select.anchor.isBefore(select.active)) {
            return new vscode.Selection(start, stop);
        } else {
            return new vscode.Selection(stop, start);
        }
    };
}
