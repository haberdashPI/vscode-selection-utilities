// start with just some basic tests to verify all is well

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

import '@wdio/globals';
import 'wdio-vscode-service';
import {setupEditor, storeCoverageStats, waitUntilCursorUnmoving} from './utils.mts';
import {sleep, TextEditor} from 'wdio-vscode-service';

describe('Active motion', () => {
    let editor: TextEditor;
    before(async () => {
        editor = await setupEditor('foo bar biz biz bar foo');
    });

    it('Can exchange active and anchor', async () => {
        await editor.moveCursor(1, 1);
        await browser.executeWorkbench(vscode => {
            vscode.commands.executeCommand('selection-utilities.moveBy', {
                unit: 'word',
                value: 3,
                select: true,
                boundary: 'start',
            });
        });
        await waitUntilCursorUnmoving(editor);
        expect(await editor.getSelectedText()).toEqual('foo bar biz ');

        await browser.executeWorkbench(vscode => {
            vscode.commands.executeCommand('selection-utilities.exchangeAnchorActive');
        });

        await browser.executeWorkbench(vscode => {
            vscode.commands.executeCommand('selection-utilities.moveBy', {
                unit: 'word',
                value: 1,
                select: true,
                boundary: 'start',
            });
        });

        await waitUntilCursorUnmoving(editor);
        expect(await editor.getSelectedText()).toEqual('bar biz ');

        await browser.executeWorkbench(vscode => {
            vscode.commands.executeCommand('selection-utilities.exchangeAnchorActive');
        });

        await browser.executeWorkbench(vscode => {
            vscode.commands.executeCommand('selection-utilities.moveBy', {
                unit: 'word',
                value: 1,
                select: true,
                boundary: 'start',
            });
        });

        await waitUntilCursorUnmoving(editor);
        expect(await editor.getSelectedText()).toEqual('bar biz biz ');
    });

    it('Can set active to left/right', async () => {
        await editor.moveCursor(1, 1);
        await browser.executeWorkbench(vscode => {
            vscode.commands.executeCommand('selection-utilities.moveBy', {
                unit: 'word',
                value: 3,
                select: true,
                boundary: 'start',
            });
        });
        await waitUntilCursorUnmoving(editor);
        expect(await editor.getSelectedText()).toEqual('foo bar biz ');

        await browser.executeWorkbench(vscode => {
            vscode.commands.executeCommand('selection-utilities.activeAtStart');
        });

        await browser.executeWorkbench(vscode => {
            vscode.commands.executeCommand('selection-utilities.moveBy', {
                unit: 'word',
                value: 1,
                select: true,
                boundary: 'start',
            });
        });

        await waitUntilCursorUnmoving(editor);
        expect(await editor.getSelectedText()).toEqual('bar biz ');

        await browser.executeWorkbench(vscode => {
            vscode.commands.executeCommand('selection-utilities.activeAtEnd');
        });

        await browser.executeWorkbench(vscode => {
            vscode.commands.executeCommand('selection-utilities.moveBy', {
                unit: 'word',
                value: 1,
                select: true,
                boundary: 'start',
            });
        });

        await waitUntilCursorUnmoving(editor);
        expect(await editor.getSelectedText()).toEqual('bar biz biz ');
    });

    it('Can shrink to active', async () => {
        await editor.moveCursor(1, 1);
        await browser.executeWorkbench(vscode => {
            vscode.commands.executeCommand('selection-utilities.moveBy', {
                unit: 'word',
                value: 3,
                select: true,
                boundary: 'start',
            });
        });
        await waitUntilCursorUnmoving(editor);
        expect(await editor.getSelectedText()).toEqual('foo bar biz ');

        await browser.executeWorkbench(vscode => {
            vscode.commands.executeCommand('selection-utilities.shrinkToActive');
        });
        await waitUntilCursorUnmoving(editor);
        await sleep(100);

        expect(await editor.getCoordinates()).toEqual([1, 13]);
        await browser.executeWorkbench(vscode => {
            vscode.commands.executeCommand('selection-utilities.moveBy', {
                unit: 'word',
                value: 1,
                select: true,
                boundary: 'start',
            });
        });
        expect(await editor.getSelectedText()).toEqual('biz ');
    });

    it('Can scroll by active', async () => {
        editor = await setupEditor(lotsOfText);
        await browser.executeWorkbench(vscode => {
            vscode.commands.executeCommand('selection-utilities.activePageMove', {
                dir: 'down',
                count: 0.5,
                select: true,
            });
        });

        await waitUntilCursorUnmoving(editor);
        const selected = await editor.getSelectedText();
        let count = 0;
        for (const _ of selected.matchAll(/\n/g)) {
            count++;
        }
        expect(count).toBeGreaterThan(4);

        await browser.executeWorkbench(vscode => {
            vscode.commands.executeCommand('selection-utilities.activePageMove', {
                dir: 'up',
                count: 0.5,
                select: true,
            });
        });
        await waitUntilCursorUnmoving(editor);
        const scrolledBackText = await editor.getSelectedText();
        expect(scrolledBackText.replace(/\s+/, '')).toEqual('');
    });

    after(async () => {
        await storeCoverageStats('activeMotions');
    });
});
