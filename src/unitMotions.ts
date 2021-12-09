import { utimes } from 'fs';
import { matches, range } from 'lodash';
import * as vscode from 'vscode';
import { updateView } from './selectionMemory';
import { clampedLineTranslate, IHash } from './util';

interface MoveByArgs{
    unit?: string,
    select?: boolean,
    selectWhole?: boolean,
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

let allUnits: IHash<IHash<RegExp | MultiLineUnit>> = {};

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

interface MultiLineUnit { regexs: RegExp[] }

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

interface Range {
    start?: vscode.Position,
    end?: vscode.Position
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
    // TODO: instead of handle this within singleRegexUnits
    // this should apply to both types of regexs, and we should
    // only look back when we need to (a.k.a when we want both boundaries)

    // if the first line is a match we have to find the first place where 
    // it starts being a match (could be before start)
    let first = true
    for(let [line, text] of docLines(document, from, forward)){
        if(unit.regexs[0].test(text)){
            // if the first line we see is a match we have to look in the reverse 
            // direction to find the first line that's a match
            if(first){
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

function moveBy(editor: vscode.TextEditor,args: MoveByArgs){
    let unit = unitNameToRegex(editor, args.unit);
    let forward = args.value === undefined ? true : args.value > 0;
    let holdSelect = args.select === undefined ? false : args.select;
    let selectWholeUnit = args.selectWhole === undefined ? false : args.selectWhole;

    let boundary = toBoundary(args);
    if(boundary === undefined){ return (sel: vscode.Selection) => sel; }
    let steps = args.value === undefined ? 1 : Math.abs(args.value);
    if(steps === 0) { return (select: vscode.Selection) => select; }

    function lastPosition(){
        let last = editor.document.lineCount-1;
        let endCol = editor.document.lineAt(last).range.end.character;
        return new vscode.Position(last, endCol);
    }
    function firstPosition(){
        return new vscode.Position(0, 0);
    }
    function* selectedBoundaries(xs: Generator<Range>, start: vscode.Position | undefined){
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
        if(forward){
            yield withStart(lastPosition());
        }else{
            yield withStart(firstPosition());
        }
    }

    function resolveStart(range: Range, unit: Unit, forward: boolean){
        if(range.start) return range.start;
        // go in the other direction to find the start of the unit
        if(range.end){
            let match = first(unitsForDoc(editor.document, range.end, unit, !forward))
            if(match?.start){
                return match.start;
            }
        }else{
            throw new Error("Expected range to have either start or end");
        }
    }
    function resolveEnd(range: Range, unit: Unit, forward: boolean){
        if(range.end) return range.end;
        if(range.start){
            // go in other direction to find the end of the unit
            let match = first(unitsForDoc(editor.document, range.start, unit, !forward))
            if(match?.end){
                return match.end
            }
        }else{
            throw new Error("Expected range to have either start or end");
        }
    }

    function* selectUnits(xs: Generator<Range>, unit: Unit, forward: boolean){
        let last: vscode.Position | undefined;
        let current: vscode.Position | undefined;
        for(let x of xs){
            if(boundary !== Boundary.Both){
                if(boundary === Boundary.Start){
                    last = current;
                    // TODO: even if start is defined, we might want to go backwards here
                    current = boundary === Boundary.Start ? 
                        resolveStart(x, unit, forward) : 
                        resolveEnd(x, unit, forward)
                }
                if(current && last){
                    yield new vscode.Selection(last, current);
                }
            }else{
                if(forward){
                    // TODO: even if start is defined, we might want to go backwards here
                    if(!x.start) x.start = resolveStart(x, unit, forward);
                    if(x.start && x.end) yield new vscode.Selection(x.start, x.end);
                }
                else{
                    if(!x.end) x.end = resolveEnd(x, unit, forward);
                    if(x.start && x.end) yield new vscode.Selection(x.start, x.end);
                } 
            }
        }
        if(boundary !== Boundary.Both){
            if(forward){
                if(current !== undefined)
                    yield new vscode.Selection(current, lastPosition());
            }else{
                if(current !== undefined)
                    yield new vscode.Selection(current, firstPosition());
            }
        }
    }

    return (select: vscode.Selection) => {
        let units = unitsForDoc(editor.document, select.active, unit, forward);
        let selections
        if(selectWholeUnit){
            selections = selectUnits(units, unit, forward)
        }else{
            selections = selectedBoundaries(units, holdSelect ? select.anchor : undefined);
        }
        let count = 0;
        for(let sel of selections){
            if(!boundsMatch(sel, select) || count > 0){
                if(forward ? sel.end.isAfter(select.active) : sel.start.isBefore(select.active))
                    count += 1;
            }
            if (count >= steps){
                return sel;
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
        let stops = unitsForDoc(editor.document,select.end,unit,false);
        let stop = first(starts)?.start;
        let start = first(stops)?.end;
        if(!stop || !start){
            return select;
        }
        let result;
        if(select.anchor.isBefore(select.active)){
            result = new vscode.Selection(start,stop);
        }else{
            result = new vscode.Selection(stop,start);
        }

        if(boundsMatch(result, select) || stop.isBefore(select.start) || start.isAfter(select.end)){
            if(thenNarrow){ return thenNarrow(select); }
            else{ return select; }
        }
        return result;
    };
}
