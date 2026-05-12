const lotsOfText = `
Ullamco sint est qui tempor cupidatat consequat nisi. Nostrud eu minim non sint officia ad
ipsum officia sunt non. Aute occaecat ipsum dolore esse ea ad quis consequat velit nulla.
Sint proident ut mollit consectetur magna excepteur Lorem minim pariatur officia excepteur
reprehenderit anim. Eiusmod aliquip consequat duis amet et sit anim in elit enim dolor.

Adipisicing ea cupidatat labore ut Lorem. Laboris eiusmod ea dolor duis ipsum officia.
Mollit incididunt consequat reprehenderit ut in quis et voluptate velit minim.

Duis reprehenderit exercitation amet enim nisi do et velit voluptate. Minim eu magna
occaecat laborum anim ut dolore magna elit commodo qui laboris. Sint eu non deserunt irure
fugiat id. Labore nulla duis consectetur exercitation proident non occaecat dolor sit eu
reprehenderit sit qui commodo. Enim officia quis ut elit occaecat consectetur aliquip id eu
sit.

Laboris in exercitation magna eiusmod laboris eiusmod voluptate officia excepteur sint anim
eiusmod labore. Anim ea incididunt duis ad nulla et mollit consequat. Ut incididunt ut
deserunt exercitation occaecat laborum esse cupidatat proident labore. In magna et voluptate
proident ut. Ea commodo non dolore ad consequat.

Est anim fugiat consectetur consequat nulla dolore elit adipisicing in aliqua ullamco esse
aliquip exercitation. Culpa eiusmod cupidatat anim veniam aliqua duis laborum consectetur
elit nisi eiusmod. Nulla tempor est culpa sunt incididunt consectetur. Eiusmod aute occaecat
pariatur ipsum aliqua laboris fugiat aliquip tempor. Pariatur tempor quis et consectetur
reprehenderit dolore minim ex. Amet voluptate elit sunt velit sit magna culpa deserunt
cillum irure nostrud.

Dolore enim ea labore qui reprehenderit aliquip duis nostrud officia proident enim laboris
id proident. Lorem Lorem qui excepteur et exercitation. Sunt amet ullamco sit deserunt esse
in voluptate dolore et pariatur id. Cupidatat labore in culpa ut ipsum sit ut eu est
proident fugiat est amet. Id occaecat exercitation enim velit adipisicing cillum labore
magna esse est. Aute ullamco deserunt elit ut laboris nulla do do magna amet Lorem occaecat
eu ad. Laborum sunt consequat nostrud velit nostrud anim aliqua reprehenderit velit sit
pariatur consequat ipsum.

Non duis dolor anim fugiat cillum et ea in qui consectetur velit. Officia laborum aliqua ea
non sit in voluptate excepteur enim est. Consectetur culpa duis veniam ut amet in consequat
aliqua cillum esse Lorem amet. Amet proident ipsum nostrud occaecat proident reprehenderit
qui laborum qui. Id anim sit veniam est est irure reprehenderit. Et elit ad magna laborum
esse. In do est consectetur aliquip dolore consectetur enim cillum veniam cillum commodo.

Lorem elit culpa pariatur eu non irure. Eu in quis anim cupidatat aliqua. Sint nostrud
tempor labore ad cillum amet occaecat reprehenderit veniam non sint.

Incididunt laboris ut aliqua laboris fugiat. Nulla labore incididunt culpa laboris tempor
pariatur sint. Aliquip proident irure amet irure nulla nulla mollit laborum magna veniam
elit deserunt. Sit ea ad quis consequat in culpa consequat nulla elit sint quis. Esse labore
duis ut veniam non ullamco nostrud irure. Adipisicing irure consequat Lorem ipsum enim dolor
sint ipsum.

Et qui aliquip elit tempor qui occaecat ipsum cupidatat exercitation ut non consectetur.
Sunt esse amet non ipsum tempor amet dolore mollit. Est laborum consequat mollit pariatur
anim consectetur proident laboris amet non. Ad ut excepteur nulla qui ut incididunt irure
magna aute velit id enim.
`;

import * as vscode from 'vscode';
import * as assert from 'assert';
/* eslint-disable */
import { assertCursorMovesBy, cursorToPos, cursorToStart, editorWithText } from './utils';
/* eslint-enable */

suite('Active motion', () => {
    let editor: vscode.TextEditor;
    let _uri;
    setup(async () => {
        [editor, _uri] = await editorWithText('foo bar biz biz bar foo');
    });

    test('Can exchange active and anchor', async () => {
        const doc = editor.document;
        cursorToStart(editor);
        await vscode.commands.executeCommand('selection-utilities.moveBy', {
            unit: 'word',
            value: 3,
            select: true,
            boundary: 'start',
        });
        assert.equal(doc.getText(editor.selection), 'foo bar biz ');
        assert.equal(editor.selection.active.character > 0, true);
        assert.equal(editor.selection.anchor.character, 0);

        await vscode.commands.executeCommand('selection-utilities.exchangeAnchorActive');
        assert.equal(editor.selection.anchor.character > 0, true);
        assert.equal(editor.selection.active.character, 0);

        await vscode.commands.executeCommand('selection-utilities.exchangeAnchorActive');
        assert.equal(editor.selection.active.character > 0, true);
        assert.equal(editor.selection.anchor.character, 0);
    });

    test('Can set active to left/right', async () => {
        cursorToStart(editor);
        await vscode.commands.executeCommand('selection-utilities.moveBy', {
            unit: 'word',
            value: 3,
            select: true,
            boundary: 'start',
        });
        assert.equal(editor.document.getText(editor.selection), 'foo bar biz ');
        assert.equal(editor.selection.active.character > 0, true);
        assert.equal(editor.selection.anchor.character, 0);

        await vscode.commands.executeCommand('selection-utilities.activeAtStart');
        assert.equal(editor.selection.anchor.character > 0, true);
        assert.equal(editor.selection.active.character, 0);

        await vscode.commands.executeCommand('selection-utilities.activeAtStart');
        assert.equal(editor.selection.anchor.character > 0, true);
        assert.equal(editor.selection.active.character, 0);

        await vscode.commands.executeCommand('selection-utilities.activeAtEnd');
        assert.equal(editor.selection.active.character > 0, true);
        assert.equal(editor.selection.anchor.character, 0);

        await vscode.commands.executeCommand('selection-utilities.activeAtEnd');
        assert.equal(editor.selection.active.character > 0, true);
        assert.equal(editor.selection.anchor.character, 0);
    });

    test('Can shrink to active', async () => {
        cursorToStart(editor);
        await vscode.commands.executeCommand('selection-utilities.moveBy', {
            unit: 'word',
            value: 3,
            select: true,
            boundary: 'start',
        });
        assert.equal(editor.document.getText(editor.selection), 'foo bar biz ');
        assert.equal(editor.selection.active.character > 0, true);
        assert.equal(editor.selection.anchor.character, 0);

        await vscode.commands.executeCommand('selection-utilities.shrinkToActive');
        assert.equal(editor.selection.active.character > 0, true);
        assert.equal(editor.selection.anchor.character, editor.selection.active.character);
    });

    test('Can scroll by active', async () => {
        [editor, _uri] = await editorWithText(lotsOfText);
        await vscode.commands.executeCommand('selection-utilities.activePageMove', {
            dir: 'down',
            count: 0.5,
            select: true,
        });

        let selected = editor.document.getText(editor.selection);
        let count = 0;
        for (const _ of selected.matchAll(/\n/g)) {
            count++;
        }
        assert.equal(count > 4, true);

        await vscode.commands.executeCommand('selection-utilities.activePageMove', {
            dir: 'up',
            count: 0.5,
            select: true,
        });

        selected = editor.document.getText(editor.selection);
        assert.equal(selected.replace(/\s+/, ''), '');
    });
});
