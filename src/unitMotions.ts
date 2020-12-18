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


function unitsForDoc(document: vscode.TextDocument, from: vscode.Position,
    boundary: Boundary, unit: RegExp | MultiLineUnit | string[], forward: boolean){

    if(unit instanceof RegExp){
        return singleLineUnitsForDoc(document, from, boundary, unit, forward);
    }else{
        return multiLineUnitsForDoc(document, from, boundary, unit as MultiLineUnit,
            forward);
    }
}

function* singleLineUnitsForDoc(document: vscode.TextDocument, from: vscode.Position,
    boundary: Boundary, unit: RegExp, forward: boolean):
    Generator<[vscode.Position, Boundary]>{

    let line = from.line;
    let char = from.character;
    let str = document.lineAt(line).text;
    if(forward){
        for(let [pos, bound] of unitBoundaries(str,boundary,unit)){
            if(pos < char) { continue; }
            else { yield [new vscode.Position(line,pos), bound]; }
        }
        while(line < document.lineCount-1){
            line++;
            str = document.lineAt(line).text;
            for(let [pos, bound] of unitBoundaries(str,boundary,unit)){
                yield [new vscode.Position(line,pos), bound];
            }
        }
        let finalChar = document.lineAt(document.lineCount-1).range.end.character;
        yield [new vscode.Position(document.lineCount-1,finalChar),
                boundary === Boundary.Both ? Boundary.End : boundary];
    }else{
        let positions = Array.from(unitBoundaries(str,boundary,unit));
        if(positions.length > 0){
            for(let [pos, bound] of positions.reverse()){
                if(pos > char) { continue; }
                else { yield [new vscode.Position(line,pos), bound]; }
            }
        }
        while(line > 0){
            line--;
            str = document.lineAt(line).text;
            let positions = Array.from(unitBoundaries(str,boundary,unit));
            for(let [pos, bound] of positions.reverse()){
                yield [new vscode.Position(line,pos), bound];
            }
        }
        yield [new vscode.Position(0,0),
            boundary === Boundary.Both ? Boundary.Start : boundary];
    }
}


function* unitBoundaries(text: string,boundary: Boundary, unit: RegExp): Generator<[number, Boundary]>{
    let reg = RegExp(unit);
    reg.lastIndex = 0;
    let match = reg.exec(text);
    let boundaries: number[] = [];

    while(match){
        if(boundary === Boundary.Start){
            yield [match.index, Boundary.Start];
        }else if(boundary === Boundary.End){
            yield [match.index + match[0].length, Boundary.End];
        }else if(boundary === Boundary.Both){
            yield [match.index, Boundary.Start];
            yield [match.index + match[0].length, Boundary.End];
        }
        match = reg.exec(text);
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

interface MultiLineUnit { regexs: RegExp[], }

function* multiLineUnitsForDoc(document: vscode.TextDocument, from: vscode.Position,
    boundary: Boundary, unit: MultiLineUnit, forward: boolean):
    Generator<[vscode.Position, Boundary]>{

    let lineNum = from.line + (unit.regexs.length-1)*(forward ? -1 : 1);
    lineNum = Math.max(Math.min(document.lineCount, lineNum), 0);
    let start = lineNum;
    let curLinesToMatch: string[] = [];
    let lines: string[] = [];
    let lastTest: boolean | undefined = undefined;
    let finalBoundary = forward ? Boundary.End : Boundary.Start;
    while(forward ? lineNum < document.lineCount : lineNum >= 0){
        let line = document.lineAt(lineNum).text;
        curLinesToMatch.push(line);
        if(curLinesToMatch.length > unit.regexs.length){
            curLinesToMatch.shift();
        }
        let ismatch = curLinesToMatch.length === unit.regexs.length ?
            forward ? unit.regexs.every((x,i) => x.test(curLinesToMatch[i])) :
            unit.regexs.
                every((x,i) => x.test(curLinesToMatch[curLinesToMatch.length-(i+1)])) :
            false;
        if(ismatch){ lines.push(line); }
        if(lastTest !== undefined && ismatch !== lastTest){
            lastTest = ismatch;
            let pos;
            if(ismatch === forward && boundary !== Boundary.End){
                pos = new vscode.Position(forward ?
                    (boundary === Boundary.Both ? lineNum : lineNum-1) :
                    lineNum + 1,0);
                finalBoundary = Boundary.End;
                if(forward ? pos.line >= from.line : pos.line <= from.line){
                    yield [pos, Boundary.Start];
                }
            }
            if(ismatch !== forward && boundary !== Boundary.Start){
                let line = forward ?
                    (boundary === Boundary.Both ? lineNum-unit.regexs.length : lineNum-unit.regexs.length+1) :
                    lineNum+unit.regexs.length-1;
                let endchar = document.lineAt(line).range.end.character;
                pos = new vscode.Position(line,endchar);
                finalBoundary = Boundary.Start;
                if(forward ? pos.line >= from.line : pos.line <= from.line){
                    yield [pos, Boundary.End];
                }
            }
            lines = [];
            start = forward ? lineNum+1 : lineNum-1;
        }
        lastTest = ismatch;
        forward ? lineNum++ : lineNum--;
    }
    // handle boundaries at start and end of document
    let documentBoundary = forward ?
        new vscode.Position(document.lineCount-1,
            document.lineAt(document.lineCount-1).range.end.character) :
        new vscode.Position(0,0);
    yield [documentBoundary, boundary !== Boundary.Both ? boundary :
        finalBoundary];
    return;
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

    return (select: vscode.Selection) => {
        // TODO: if its a default word, we take advantage
        // of language specific word definitions
        let start: vscode.Position | undefined = undefined;
        if(selectWholeUnit){
            let units = unitsForDoc(editor.document,select.active,boundary,
                unit,!forward);
            let value = first(units);
            if(value !== undefined) { [start] = value; }
        }else if(holdSelect){
            start = select.anchor;
        }

        let units = unitsForDoc(editor.document,select.active,boundary,
            unit,forward);
        let count = 0;
        let pos = select.active;
        let bound: Boundary;
        for([pos, bound] of units){
            if(forward ? bound === Boundary.Start : bound === Boundary.End){
                if(selectWholeUnit && boundary === Boundary.Both){
                    start = pos;
                }
            }
            if(!pos.isEqual(select.active)){
                if(selectWholeUnit && boundary === Boundary.Both){
                    if(forward ? bound === Boundary.End :
                                              bound === Boundary.Start){
                        count++;
                    }
                }else{ count++; }
            }
            if(count === steps) { break; }
        }
        if(start){
            return new vscode.Selection(start,pos);
        }else{
            return new vscode.Selection(pos,pos);
        }
    };
}
