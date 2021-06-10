// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import { updateUnits, registerUnitMotions } from './unitMotions';
import { updateDecorators, registerSelectionMemoryCommands } from './selectionMemory';
import { registerActiveMotions } from './activeMotions';
import { registerSelectionModifiers } from './selectionModifiers';
import { registerSelectionFilters } from './selectionFilters';
import { registerSelectionAlignments } from './selectionAlignment';
import { registerSymmetricModifiers } from "./symmetricModifiers";

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {

    updateDecorators();
    updateUnits();

    vscode.workspace.onDidChangeConfiguration((e?: vscode.ConfigurationChangeEvent) => {
        updateUnits(e);
        updateDecorators(e);
    });

    registerUnitMotions(context);
    registerSelectionMemoryCommands(context);
    registerActiveMotions(context);
    registerSelectionModifiers(context);
    registerSelectionFilters(context);
    registerSelectionAlignments(context);
    registerSymmetricModifiers(context);
}

// this method is called when your extension is deactivated
export function deactivate() {}
