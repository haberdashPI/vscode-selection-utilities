import { utimes } from 'fs';
import { matches } from 'lodash';
import * as vscode from 'vscode';
import { updateView } from './selectionMemory';
import { IHash } from './util';

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

        yield* mapIter(matches, ([start, len]) => new vscode.Range(
            new vscode.Position(i, start),
            new vscode.Position(i, start+len)
        ))
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
        if(offset && !forward && match.index > offset){ return }
        if(offset === undefined || !forward || match.index > offset)
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

function unitsForDoc(document: vscode.TextDocument, from: vscode.Position,
    unit: RegExp | MultiLineUnit | string[], forward: boolean){

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

function* singleRegexUnitsForDoc(document: vscode.TextDocument, from: vscode.Position,
    unit: MultiLineUnit, forward: boolean){
    
    let first_match: undefined | number = undefined;
    function closeMatch(line: number){
        if(first_match !== undefined){
            let startLine = forward ? first_match : line+1;
            let endLine =   forward ? line-1 : first_match;
            let endCol = document.lineAt(new vscode.Position(endLine, 0)).range.end.character;
            return new vscode.Range(
                new vscode.Position(startLine, 0),
                new vscode.Position(endLine, endCol)
            )
        }
    }
    for(let [line, text] of docLines(document, from, forward)){
        if(unit.regexs[0].test(text)){
            if(first_match === undefined){
                first_match = line;
            }
        }else{
            let result = closeMatch(line)
            if(result !== undefined) yield result
        }
    }
    let result = closeMatch(forward ? document.lineCount : 1);
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

    for(let [line, text] of docLines(document, from, forward)){
        buffer.push([line, text])
        if(buffer.length > unit.regexs.length){
            buffer.shift()
        }
        if(buffer.length === unit.regexs.length){
            if(doesMatch(unit, buffer)){
                let startLine = forward ? buffer[0][0] : buffer[buffer.length][0]
                let endLine =  !forward ? buffer[0][0] : buffer[buffer.length][0]
                let endCol = document.lineAt(endLine).range.end.character
                yield new vscode.Range(
                    new vscode.Position(startLine, 0),
                    new vscode.Position(endLine, endCol)
                )
            }
        }
    }
}

function* multiLineUnitsForDoc(document: vscode.TextDocument, from: vscode.Position,
    unit: MultiLineUnit, forward: boolean): Generator<vscode.Range>{

    if(unit.regexs.length > 1){
        yield* multiRegexUnitsForDoc(document, from, unit, forward);
    }else{
        yield* singleRegexUnitsForDoc(document, from, unit, forward)
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

function moveBy(editor: vscode.TextEditor,args: MoveByArgs){
    let unit = unitNameToRegex(editor, args.unit);
    let forward = args.value === undefined ? true : args.value > 0;
    let holdSelect = args.select === undefined ? false : args.select;
    let selectWholeUnit = args.selectWhole === undefined ? false : args.selectWhole;

    let boundary: Boundary;
    if(args.boundary === undefined){
        boundary = Boundary.Start;
    }else if(args.boundary === 'start'){
        boundary = Boundary.Start;
    }else if(args.boundary === 'end'){
        boundary = Boundary.End;
    }else if(args.boundary === 'both'){
        boundary = Boundary.Both;
    }else{
        vscode.window.showErrorMessage("Unexpected value for boundary argument: '"+
            args.boundary+"'.");
        return (select: vscode.Selection) => select;
    }
    let steps = args.value === undefined ? 1 : Math.abs(args.value);
    if(steps === 0) { return (select: vscode.Selection) => select; }

    function unitToResult(fromSel: vscode.Selection, unit: vscode.Range, start: vscode.Position = fromSel.active){
        let land: vscode.Position
        if(boundary === Boundary.End){
            land = unit.end
        }else if(boundary === Boundary.Start){
            land = unit.start
        }else { // Both
            if(forward){
                if(start.isAfter(unit.start)) land = unit.end
                else land = unit.start
            }else{
                if(start.isBefore(unit.end)) land = unit.start
                else land = unit.end
            }
        }
        if(holdSelect){
            return new vscode.Selection(fromSel.anchor, land);
        }else if(selectWholeUnit){
            if(land = unit.start){
                return new vscode.Selection(unit.end, land);
            }else{
                return new vscode.Selection(unit.start, land);
            }
        }else{
            return new vscode.Selection(land, land)
        }
    }

    return (select: vscode.Selection) => {
        let units = unitsForDoc(editor.document, select.active, unit, forward);
        for(let curUnit of units){
            let result = unitToResult(select, curUnit)
            if(!boundsMatch(result, select)){
                return result;
            }else if(boundary === Boundary.Both && !selectWholeUnit){
                result = unitToResult(select, curUnit, forward ? curUnit.end : curUnit.start);
                if(!boundsMatch(result, select)){
                    return result
                }
            }
        }
        return select;
    };
}

function boundsMatch(x: vscode.Selection, y: vscode.Selection){
    return (x.start.isEqual(y.start) && x.end.isEqual(y.end)) ||
        (x.end.isEqual(y.start) && x.start.isEqual(y.end))
}

// TODO: refactor this function
function narrowTo(editor: vscode.TextEditor, args: NarrowByArgs): (select: vscode.Selection) => vscode.Selection {
    let unit = unitNameToRegex(editor, args.unit);
    let thenNarrow = args.then === undefined ? undefined :
        narrowTo(editor, {
            unit: args.then,
            boundary: args.thenBoundary === undefined ? args.boundary :
                args.thenBoundary
        });

    let boundary: Boundary;
    if(args.boundary === undefined){
        boundary = Boundary.Both;
    }else if(args.boundary === 'start'){
        boundary = Boundary.Start;
    }else if(args.boundary === 'end'){
        boundary = Boundary.End;
    }else if(args.boundary === 'both'){
        boundary = Boundary.Both;
    }else{
        vscode.window.showErrorMessage("Unexpected value for boundary argument: '"+args.boundary+"'.");
        return (select: vscode.Selection) => select;
    }

    return (select: vscode.Selection) => {
        if(select.anchor.isEqual(select.active)){
            return select;
        }
        let starts = unitsForDoc(editor.document,select.start,
            boundary === Boundary.Both ? Boundary.Start : boundary,
            unit,true);
        let step = first(starts);
        let start = step === undefined ? select.start : step[0];

        let stops = unitsForDoc(editor.document,select.end,
            boundary === Boundary.Both ? Boundary.End : boundary,
            unit,false);
        step = first(stops);
        let stop = step === undefined ? select.end : step[0];

        if(stop.isEqual(select.end) && start.isEqual(select.start)){
            if(thenNarrow){ return thenNarrow(select); }
        }
        if(stop.isBefore(select.start) || start.isAfter(select.end)){
            if(thenNarrow){ return thenNarrow(select); }
            else{ return select; }
        }
        if(select.anchor.isBefore(select.active)){
            return new vscode.Selection(start,stop);
        }else{
            return new vscode.Selection(stop,start);
        }
    };
}
