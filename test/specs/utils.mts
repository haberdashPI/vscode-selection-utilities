import {browser, expect} from '@wdio/globals';
import 'wdio-vscode-service';
import {Key} from 'webdriverio';
import {InputBox, TextEditor, Workbench, sleep} from 'wdio-vscode-service';
import replaceAll from 'string.prototype.replaceall';
import loadash from 'lodash';
const {isEqual} = loadash;
import * as fs from 'fs';
import * as path from 'path';

export async function storeCoverageStats(name: string) {
    if (!process.env.COVERAGE) {
        return;
    }
    const editor = await setupEditor('');
    await browser.executeWorkbench(vscode => {
        vscode.commands.executeCommand('selection-utilities.writeCoverageToEditor');
    });

    await sleep(1000);
    await waitUntilCursorUnmoving(editor);

    const coverageStr = await editor.getText();
    fs.writeFileSync(
        path.join(process.env.COVERAGE_PATH || '.', name + '.json'),
        coverageStr
    );
}

export async function cursorToTop(editor: TextEditor) {
    // this method appears to be a common source unreliable behavior so we do the commands
    // slowly
    (await editor.elem).click();
    await sleep(500);
    const workbench = await browser.getWorkbench();
    await workbench.executeCommand('Select All');
    await sleep(100);
    await browser.keys(Key.ArrowLeft);
    await sleep(100);
    browser.waitUntil(async () => {
        const coord = await editor.getCoordinates();
        coord[0] === 1 && coord[1] === 1;
    });
    await sleep(200);
}

export async function getEditorMatching(workbench: Workbench, r: RegExp | string) {
    const editorView = await workbench.getEditorView();
    const title = await browser.waitUntil(
        async () => {
            const tab = await editorView.getActiveTab();
            const title = await tab?.getTitle();
            if (title && title.match(r)) {
                return title;
            }
            return;
        },
        {interval: 1000, timeout: 10000}
    );

    return (await editorView.openEditor(title!)) as TextEditor;
}

export async function clearNotifications(workbench: Workbench) {
    const notifications = await workbench.getNotifications();
    for (const note of notifications) {
        await note.dismiss();
    }
}

export function cleanWhitespace(str: string) {
    let result = replaceAll(str, /^[^\n\r\w]+(?=[\S\n\r])/gm, '');
    result = replaceAll(result, /^[^\n\r\S]+$/gm, '');
    return result;
}

export async function setupEditor(str: string) {
    str = cleanWhitespace(str);
    const workbench = await browser.getWorkbench();

    // clear any older notificatoins
    console.log('[DEBUG]: clearing notifications');
    clearNotifications(workbench);

    console.log('[DEBUG]: opening new editor pane');
    browser.keys([Key.Ctrl, 'n']);
    const editor = await getEditorMatching(workbench, /Untitled/);

    // set the text
    // NOTE: setting editor text is somewhat flakey, so we verify that it worked
    console.log('[DEBUG]: setting text to: ' + str.slice(0, 200) + '...');
    await editor.setText(str);
    await sleep(1000);
    await waitUntilCursorUnmoving(editor);
    const text = await editor.getText();

    expect(text).toEqual(str);

    // focus the editor
    console.log('[DEBUG]: Focusing editor');
    await editor.moveCursor(1, 1);

    return editor;
}

async function coordChange(
    editor: TextEditor,
    oldpos: {x: number; y: number}
): Promise<{x: number; y: number}> {
    const newpos = await editor.getCoordinates();
    const ydiff = newpos[0] - oldpos.y;
    const xdiff = newpos[1] - oldpos.x;
    return {y: ydiff, x: xdiff};
}

export async function waitUntilCursorUnmoving(
    editor: TextEditor,
    oldpos?: {x: number; y: number}
) {
    if (!oldpos) {
        const [y, x] = await editor.getCoordinates();
        oldpos = {x, y};
    }

    let lastMove = {x: 0, y: 0};
    let stepsUnchanged = 0;
    return await browser.waitUntil(
        async () => {
            const move = await coordChange(editor, oldpos);

            if (isEqual(lastMove, move)) {
                stepsUnchanged += 1;
            } else {
                lastMove = move;
                stepsUnchanged = 0;
            }
            if (stepsUnchanged > 1) {
                return move;
            }
        },
        {interval: 300, timeout: 9000}
    );
}

export async function movesCursorInEditor(
    action: () => Promise<void>,
    by: [number, number],
    editor: TextEditor
) {
    const [y, x] = await editor.getCoordinates();
    const oldpos = {x, y};
    await action();
    const expected = {y: by[0], x: by[1]};
    const actual = await coordChange(editor, oldpos);
    // most of the time we can just run `expect` right away...
    if (isEqual(actual, expected)) {
        expect(actual).toEqual(expected);
        return;
    }
    // but some commands require that we wait before their effects are observed...
    // in this case we need to have some confidence that no further moves are
    // going to happen
    const maybeActual = await waitUntilCursorUnmoving(editor, oldpos);
    expect(maybeActual).toEqual(expected);
}

export async function movesCursorTo(
    action: () => Promise<void>,
    by: [number, number],
    editor: TextEditor
) {
    await action();
    const newpos = await editor.getCoordinates();
    expect({y: newpos[0], x: newpos[1]}).toEqual({y: by[0], x: by[1]});
}

export async function setFileDialogText(str: string) {
    const workbench = await browser.getWorkbench();
    const fileInput = await new InputBox(workbench.locatorMap).wait();
    await sleep(100);
    // clearing text for this input box seems to work a little differently than the
    // normal up, so we have to manually remove the text before setting the text
    const input_ = await fileInput.inputBox$.$(fileInput.locators.input);
    await input_.click();
    await browser.keys([Key.Ctrl, 'a']);
    await browser.keys(Key.Backspace);
    await sleep(100);
    await fileInput.setText(str);
    // confirmation is also flakey
    await sleep(100);
    await fileInput.confirm();
    await sleep(100);
    try {
        fileInput.confirm();
    } catch (e) {
        console.dir(e);
    }
}
