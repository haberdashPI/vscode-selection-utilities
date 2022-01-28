import * as vscode from 'vscode';
import { updateView } from './selectionMemory';
import { clampedLineTranslate, IHash } from './util';

interface MoveByArgs{
    unit?: string,
    select?: boolean,
    selectWhole?: boolean,
    selectOneUnit?: boolean,
    value?: number
    boundary?: string,
}

interface NarrowByArgs{
    unit?: string,
    then?: string,
    thenBoundary?: string,
    boundary?: string,
}

interface UnitDef{
    name: string,
    regex: string,
}


interface MultiUnitDef {
    name: string,
    regexs: string | string[],
}

interface MultiLineUnit { regexs: RegExp[] }

let allUnits: IHash<IHash<RegExp | MultiLineUnit>> = {};

const defaultUnits = ["subword", "word", "WORD", "paragraph", "section", "subsection"];

export function updateUnits(event?: vscode.ConfigurationChangeEvent, newid?: string){
    if(!event || event.affectsConfiguration("selection-utilities")){
        let ids = Object.keys(allUnits);
        ids.push('[GENERIC]');
        newid !== undefined && ids.push(newid);
        for(let id of ids){
            let config = id !== '[GENERIC]' ?
                vscode.workspace.getConfiguration("selection-utilities", {languageId: id}) :
                vscode.workspace.getConfiguration("selection-utilities");
            let newUnits = config.get<Array<UnitDef | MultiUnitDef>>("motionUnits");
            let units: IHash<RegExp | MultiLineUnit> = {};
            if(newUnits){
                for(let unit of newUnits){
                    if((unit as UnitDef).regex){
                        units[unit.name] = RegExp((unit as UnitDef).regex,"gu");
                    }else if((unit as MultiUnitDef).regexs){
                        let unitdef = (unit as MultiUnitDef);
                        let regexs: string[];
                        if(unitdef.regexs instanceof Array){
                            regexs = (unitdef.regexs as string[]);
                        }else{
                            regexs = [(unitdef.regexs as string)];
                        }
                        units[unit.name] = {
                            regexs: regexs.map(x => RegExp(x,"u"))
                        };
                    }else{
                        vscode.window.showErrorMessage("Malformed unit definition");
                    }
                }
            }
            allUnits[id] = units;
        }
    }
}

export function registerUnitMotions(context: vscode.ExtensionContext){
    let command = vscode.commands.registerCommand('selection-utilities.moveBy',
    (args: MoveByArgs) => {
        let editor = vscode.window.activeTextEditor;
        if(editor){
            editor.selections = editor.selections.map(moveBy(editor,args));
            updateView(editor);
        }
    }
    );
    context.subscriptions.push(command);

    command = vscode.commands.registerCommand('selection-utilities.narrowTo',
    (args: NarrowByArgs) => {
        let editor = vscode.window.activeTextEditor;
        if(editor){
            editor.selections = editor.selections.map(narrowTo(editor,args));
            updateView(editor);
        }
    }
    );
    context.subscriptions.push(command);

    for(let unit of defaultUnits){
        for(let dir of ['Next','Previous']){
            for(let selType of ['moveCursorTo', 'moveTo', 'selectTo']){
                let unitLabel = unit.charAt(0).toUpperCase() + unit.slice(1)
                console.log("unitLabel: ")
                console.log(unitLabel)
                let args = {
                    unit: unit,
                    select: selType !== 'moveCursorTo',
                    selectWhole: selType === 'moveTo',
                    value: dir === 'Next' ? 1 : -1,
                    boundary: 'start',
                }
                let commandName = selType+dir+unitLabel
                command = vscode.commands.registerCommand('selection-utilities.'+commandName, (dont_use) => {
                    let editor = vscode.window.activeTextEditor;
                    if(editor){
                        editor.selections = editor.selections.map(moveBy(editor, args))
                        updateView(editor);
                    }
                })
                context.subscriptions.push(command);
            }
        }
    }
}


interface Range {
    start?: vscode.Position,
    end?: vscode.Position
}

function* singleLineUnitsForDoc(doc: vscode.TextDocument, start: vscode.Position, unit: RegExp, wrapAround: boolean, forwards: boolean){
    let offset: number | undefined = start.character
    for(const [line, i] of linesOf(doc, start, wrapAround || false, forwards)){
        let matchesItr = regexMatches(unit, line, forwards, offset)
        let matches = forwards ? matchesItr : Array.from(matchesItr).reverse()

        yield* mapIter(matches, ([start, len]) => {return {
            start: new vscode.Position(i, start),
            end: new vscode.Position(i, start+len)
        }})
        offset = undefined
    }
}

function* linesOf(doc: vscode.TextDocument, pos: vscode.Position,
    wrap: boolean, forward: boolean): Generator<[string, number]>{

    yield [doc.lineAt(pos).text, pos.line]
    let line = pos.line + (forward ? 1 : -1)
    while(forward ? line < doc.lineCount : line >= 0){
        yield [doc.lineAt(line).text, line]
        line += (forward ? 1 : -1)
    }
    if(wrap){
        line = forward ? 0 : doc.lineCount - 1
        while(forward ? line < doc.lineCount : line > 0){
            yield [doc.lineAt(line).text, line]
            line += (forward ? 1 : -1)
        }
    }
}

function* regexMatches(matcher: RegExp, line: string, forward: boolean, offset: number | undefined): Generator<[number, number]>{
    matcher.lastIndex = 0
    let match = matcher.exec(line)
    while(match){
        if(offset !== undefined && !forward && match.index > offset){ return }
        if(offset === undefined || !forward || match.index+match[0].length > offset)
            yield [match.index, match[0].length]
        let newmatch = matcher.exec(line)
        if(newmatch && newmatch.index > match.index){
            match = newmatch
        }else{
            match = null
        }
    }
}

function* mapIter<T, R>(iter: Iterable<T>, fn: (x: T) => R){
    for(const x of iter){
        yield fn(x)
    }
}

type Unit = RegExp | MultiLineUnit | string[]
function unitsForDoc(document: vscode.TextDocument, from: vscode.Position,
    unit: Unit, forward: boolean){

    if(unit instanceof RegExp){
        return singleLineUnitsForDoc(document, from, unit, false, forward);
    }else{
        return multiLineUnitsForDoc(document, from, unit as MultiLineUnit,
            forward);
    }
}

export function first<T>(x: Iterable<T>): T | undefined {
    let itr: Iterator<T> = x[Symbol.iterator]();
    let result: IteratorResult<T,T> = itr.next();
    if(!result.done){
        return result.value;
    }else{
        return undefined;
    }
}

enum Boundary { Start, End, Both }

function* docLines(document: vscode.TextDocument, from: vscode.Position, forward: boolean): Generator<[number, string]>{
    yield [from.line, document.lineAt(from).text];
    if(forward){
        while(from.line+1 < document.lineCount){
            from = new vscode.Position(from.line+1, 0);
            yield [from.line, document.lineAt(from).text];
        }
    }else{
        while(from.line > 0){
            from = new vscode.Position(from.line-1, 0);
            yield [from.line, document.lineAt(from).text];
        }
    }
}

function* singleRegexUnitsForDoc(document: vscode.TextDocument, from: vscode.Position,
    unit: MultiLineUnit, forward: boolean){
    
    let first_match: undefined | null | number = undefined;
    function closeMatch(line: number){
        if(first_match !== undefined){
            let startLine: null | number = forward ? first_match : line+1;
            let endLine: null | number = forward ? line-1 : first_match;
            let endCol = endLine === null ? null : document.lineAt(new vscode.Position(endLine, 0)).range.end.character;
            return {
                start: startLine !== null ? new vscode.Position(startLine, 0) : undefined,
                end: endLine !== null && endCol !== null ? new vscode.Position(endLine, endCol) : undefined,
            };
        }
    }
    let first = true
    for(let [line, text] of docLines(document, from, forward)){
        if(unit.regexs[0].test(text)){
            if(first){
                // if the very first line matches, the `from` position could
                // fall in the middle of a sequence of matching lines we
                // represent the fact that we dont' know where this sequence
                // starts using `null`
                first_match = null;
            }else if(first_match === undefined){
                first_match = line;
            }
        }else{
            let result = closeMatch(line)
            if(result !== undefined){
                first_match = undefined
                yield result
            } 
        }
        first = false
    }
    let result = closeMatch(forward ? document.lineCount : -1);
    if(result !== undefined) yield result;
}

function* multiRegexUnitsForDoc(document: vscode.TextDocument, from: vscode.Position,
    unit: MultiLineUnit, forward: boolean){
    
    let buffer: [number, string][] = [];
    let doesMatch
    if(forward){
        doesMatch = (unit: MultiLineUnit, buffer: [number, string][]) => {
            return unit.regexs.every((x, i) => x.test(buffer[i][1]))
        }
    }else{
        doesMatch = (unit: MultiLineUnit, buffer: [number, string][]) => {
            return unit.regexs.every((x, i) => x.test(buffer[buffer.length - (i+1)][1]));
        }
    }

    let start_from = clampedLineTranslate(from, document, -unit.regexs.length+1);
    for(let [line, text] of docLines(document, start_from, forward)){
        buffer.push([line, text])
        if(buffer.length > unit.regexs.length){
            buffer.shift();
        }
        if(buffer.length === unit.regexs.length){
            if(doesMatch(unit, buffer)){
                let startLine = forward ? buffer[0][0] : buffer[buffer.length-1][0]
                let endLine =  !forward ? buffer[0][0] : buffer[buffer.length-1][0]
                let endCol = document.lineAt(endLine).range.end.character
                yield {
                    start: new vscode.Position(startLine, 0),
                    end: new vscode.Position(endLine, endCol)
                }
            }
        }
    }
}

function* multiLineUnitsForDoc(document: vscode.TextDocument, from: vscode.Position,
    unit: MultiLineUnit, forward: boolean): Generator<Range>{

    if(unit.regexs.length > 1){
        yield* multiRegexUnitsForDoc(document, from, unit, forward);
    }else{
        yield* singleRegexUnitsForDoc(document, from, unit, forward);
    }
}

function unitNameToRegex(editor: vscode.TextEditor, name?: string){
    let id = editor.document?.languageId || "[GENERIC]";
    if(allUnits[id] === undefined){
        updateUnits(undefined, id);
    }
    return name === undefined ? /\p{L}+/gu :
        allUnits[id] === undefined ? allUnits['[GENERIC]'][name] :
        allUnits[id][name] || allUnits['[GENERIC]'][name];
}

function toBoundary(args: {boundary?: string}) {
    if(args.boundary === undefined){
        return Boundary.Start;
    }else if(args.boundary === 'start'){
        return Boundary.Start;
    }else if(args.boundary === 'end'){
        return Boundary.End;
    }else if(args.boundary === 'both'){
        return Boundary.Both;
    }else{
        vscode.window.showErrorMessage("Unexpected value for boundary argument: '"+
            args.boundary+"'.");
        return undefined
    }
}

// this handles unit cleanup when looking for two boundaries, it handles two
// problesm:
// 1. when you look for units in one direction sometime you miss the start (or
//    end) of a unit you're in the middle of (for multi-line units in particular).
//    If we want to resolve the boundaries of a unit, we need to look 
//    backwards from the starting position.
// 2. when you get to the end of the document you need to treat the edge of the
//    document as unit boundaries to make things work out cleanly for
//    'start-only' and `end-only` boundary resolution
function* resolveUnitBoundaries(resolve: Boundary | undefined,
    units: Generator<Range>, document: vscode.TextDocument,
    from: vscode.Position, unit: Unit,
    forward: boolean): Generator<Range> {

    function* resolveUnit(first_unit: Range | undefined){
        let backwards = unitsForDoc(document, from, unit, !forward)
        let foundUnit = false
        function* resolveHelper(back: Range){
            if(resolve === Boundary.Start){
                if(back.start){
                    yield back;
                    if(first_unit?.start){ yield first_unit }
                    else{
                        let next = first(units)
                        if(next?.start){ yield next; }
                        else yield {start: forward ? lastPosition(document) : firstPosition()};
                    }
                    foundUnit = true
                }
            }else if(resolve === Boundary.End){
                if(back.end){
                    yield back;
                    if(first_unit?.end) yield first_unit
                    else{
                        let next = first(units);
                        if(next?.end) yield next;
                        else yield {end: forward ? lastPosition(document) : firstPosition()};
                    }
                    foundUnit = true
                }
            }else if(back.start){
                if(back.end){ 
                    foundUnit = true;  
                    yield back; 
                } else if(first_unit?.end){
                    foundUnit = true;
                    yield {start: back.start, end: first_unit.end}
                }
                if(first_unit?.end && first_unit?.start) {
                    yield first_unit
                    foundUnit = true
                }
            }
        }
        for(let back of backwards){
            yield* resolveHelper(back);
            if(foundUnit) return;
        }

        if(resolve !== Boundary.Both){
            if(forward){
                let first = firstPosition()
                yield* resolveHelper({start: first, end: first});
            }else{
                let last = lastPosition(document)
                yield* resolveHelper({start: last, end: last});
            }
        }
    }

    let first_unit = first(units)
    if (first_unit) {
        if(forward){
            if(resolve === Boundary.End ? 
                !first_unit.end || first_unit.end.isAfter(from) : 
                !first_unit.start || first_unit.start.isAfter(from)) {
                yield* resolveUnit(first_unit);
            }else yield first_unit
        }else if(resolve === Boundary.Start ? 
                 !first_unit.start || first_unit.start.isBefore(from) :
                 !first_unit.end   || first_unit.end.isBefore(from)){
            yield* resolveUnit(first_unit);
        }else{
            yield first_unit;
        }
    }else {
        yield* resolveUnit(first_unit);
    }
    yield* units;
    if(resolve !== Boundary.Both){
        if(forward){
            let last = lastPosition(document)
            yield {start: last, end: last};
        }else{
            let first = firstPosition()
            yield {start: first, end: first};
        }
    }
}

function lastPosition(document: vscode.TextDocument){
    let last = document.lineCount-1;
    let endCol = document.lineAt(last).range.end.character;
    return new vscode.Position(last, endCol);
}
function firstPosition(){
    return new vscode.Position(0, 0);
}

function moveBy(editor: vscode.TextEditor,args: MoveByArgs){
    let unit = unitNameToRegex(editor, args.unit);
    let forward = args.value === undefined ? true : args.value > 0;
    let holdSelect = args.select === undefined ? false : args.select;
    let selectWholeUnit = args.selectWhole === undefined ? false : args.selectWhole;
    let selectOneUnit = args.selectOneUnit;

    let boundary = toBoundary(args);
    if(boundary === undefined){ return (sel: vscode.Selection) => sel; }
    let steps = args.value === undefined ? 1 : Math.abs(args.value);
    if(steps === 0) { return (select: vscode.Selection) => select; }

    // translate a sequence of units (regex start and stop boundaries)
    // to a sequence of selection points (where we extend the active selection
    // point to a new unit boundary at each step)
    function* selectBoundaries(xs: Generator<Range>, start: vscode.Position | undefined){
        function withStart(x: vscode.Position){
            if(start) return new vscode.Selection(start, x);
            else return new vscode.Selection(x, x);
        }
        for(let x of xs){
            if(boundary === Boundary.Start){
                if(x.start) yield withStart(x.start)
            }else if(boundary === Boundary.End){
                if(x.end) yield withStart(x.end);
            }else{
                if(x.start) yield withStart(x.start);
                if(x.end) yield withStart(x.end);
            }
        }
        // treat the edge of the document as a boundary as well
        if(forward){
            yield withStart(lastPosition(editor.document));
        }else{
            yield withStart(firstPosition());
        }
    }

    // translate a sequence of units (regex start and stop boundaries)
    // to a sequence of selections: the selections surround a single
    // unit around from start-to-start, end-to-end or start-to-end
    function* selectUnits(xs: Generator<Range>, forward: boolean){
        let last: vscode.Position | undefined | null = null;
        let current: vscode.Position | undefined | null;
        for(let x of xs){
            if(boundary !== Boundary.Both){
                last = current;
                current = boundary === Boundary.Start ? x.start : x.end
                if(current && last){
                    yield new vscode.Selection(last, current);
                }
            }else{
                if(!x.start || !x.end) throw new Error("Unexpected missing range bound")
                if(forward) yield new vscode.Selection(x.start, x.end); 
                else yield new vscode.Selection(x.start, x.end);  
            }
        }
        if(boundary !== Boundary.Both){
            if(forward){
                if(current === undefined) throw new Error("Unexepcted missing range bound")
                else if(current !== null)
                    yield new vscode.Selection(current, lastPosition(editor.document));
            }else{
                if(current === undefined) throw new Error("Unexepcted missing range bound")
                else if(current !== null)
                    yield new vscode.Selection(current, firstPosition());
            }
        }
    }

    // return a function that modifies each selection in turn
    // (it will be applied to all selections)
    return (select: vscode.Selection) => {
        let units = unitsForDoc(editor.document, select.active, unit, forward);
        let selections
        if(selectWholeUnit){
            // if we are selecting whole units we need to use `resolveUnitBoundaries`
            // to look possibly backwards from the starting position to resolve
            // the start of a unit
            let resolved = resolveUnitBoundaries(boundary, units, editor.document, select.active, unit, forward);
            selections = selectUnits(resolved, forward);
        }else{
            selections = selectBoundaries(units, holdSelect ? select.anchor : undefined);
        }
        let count = 0;
        let lastsel;
        let startSel: vscode.Position | undefined = undefined
        for(let sel of selections){
            if(count > 0 || !boundsMatch(sel, select)){
                if(forward ? sel.end.isAfter(select.active) : sel.start.isBefore(select.active))
                    count += 1;
                if(count === 1){ startSel = sel.anchor; }
            }
            if (count >= steps){
                if(!selectOneUnit && startSel && selectWholeUnit){
                    return new vscode.Selection(startSel, sel.active);
                }else{
                    return sel;
                }
            }
            lastsel = sel;
        }
        if(count > 0 && lastsel){ 
            if(!selectOneUnit && startSel){
                return new vscode.Selection(startSel, lastsel.active);
            }else{
                return lastsel; 
            }
        }
        return select;
    };
};

function boundsMatch(x: vscode.Selection, y: vscode.Selection){
    return (x.start.isEqual(y.start) && x.end.isEqual(y.end)) ||
        (x.end.isEqual(y.start) && x.start.isEqual(y.end))
}

function narrowTo(editor: vscode.TextEditor, args: NarrowByArgs): (select: vscode.Selection) => vscode.Selection {
    let unit = unitNameToRegex(editor, args.unit);
    let thenNarrow = args.then === undefined ? undefined :
        narrowTo(editor, {
            unit: args.then,
            boundary: args.thenBoundary === undefined ? args.boundary :
                args.thenBoundary
        });

    let boundary = toBoundary(args);
    if(boundary === undefined){ return (sel: vscode.Selection) => sel; }

    return (select: vscode.Selection) => {
        if(select.anchor.isEqual(select.active)){
            return select;
        }
        let starts = unitsForDoc(editor.document,select.start,unit,true);
        let start: vscode.Position | undefined;
        for(let s of starts){
            if(s.start?.isAfterOrEqual(select.end)) break;
            if(s.start?.isAfterOrEqual(select.start)){
                start = s.start
                break;
            }
        }
        let stops = unitsForDoc(editor.document,select.end,unit,false);
        let stop: vscode.Position | undefined;
        for(let s of stops){
            if(s.end?.isBeforeOrEqual(select.start)) break;
            if(s.end?.isBeforeOrEqual(select.end)){
                stop = s.end;
                break;
            } 
        }
        if(!stop || !start){
            if(thenNarrow){ return thenNarrow(select);}
            return select;
        }
        let result;
        if(select.anchor.isBefore(select.active)){
            return new vscode.Selection(start,stop);
        }else{
            return new vscode.Selection(stop,start);
        }
    };
}
