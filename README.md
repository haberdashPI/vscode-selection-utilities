# Selection Utilities

[![Project Status: WIP – Initial development is in progress, but there has not yet been a stable, usable release suitable for the public.](https://img.shields.io/badge/Project%20Status-WIP-yellow)](https://www.repostatus.org/#wip)

This provides a series of utilities for manipulating, saving and creating both single and
multiple selections, inspired by [Kakoune](http://kakoune.org/). This is an extension that I
use daily, so it is in good working order for many kinds of every-day use; however I am
constantly adding new features and changing command names, so if you do use this extension
be aware that things may break with new releases.

I use these commands mostly in conjunction with [vscode-modaledit](https://johtela.github.io/vscode-modaledit/docs/tutorial.html).

There are many commands, and they are designed to work in conjunction with one another.

## Commands

### Cursor Position

These commands enable each cursors' position to be changed relative to the associated
selection. The cursor is the "active" position and the other end of a selection is the
"anchor".

- "Exchange active and anchor" (`selection-utilities.exchangeAnchorActive`)
- "Active to end" (`selection-utilities.activeAtEnd`)
- "Active to start" (`selection-utilities.activeAtStart`)

### Saving selections

Sometimes it can be helpful to save a selection for later, or add any arbitrary selection to
a list of soon-to-be multiple selections. Saved selections can also be used to exchange the
position of two regions of text. The following commands manipulate or recall from a memory
a set of selections. Saved selections are displayed in the editor using a distinct color.

All of the commands that recall or store from memory take an optional argument, `register`,
which is a string that names a specific memory register. If not specified, the "default"
memory register is used. Only the default register is displayed.

- "Save to selection memory" (`selection-utilities.appendToMemory`): this appends the
  current word under the cursor or the current selection(s) to a memory of past selections.
- "Swap current selections with saved selections (or save current selections)" (`selection-utilities.swapWithMemory`): this can be used to quickly exchange text; if no selections are
  currently saved, this will have the same effect as "Save to selection memory". Otherwise,
  it will swap the currently selected text (or word under the cursor) with the text
  of the save selection. In the case of multiple selections there must be as many saved
  selections as current selections.
- "Cancel Selection (end on primary)" (`selection-utilities.cancelSelection`):
  This behaves much like the default `cancelSelection` command, but it saves the
  cancled selection to a memory named "cancel" which can be restored using "Restore from selection memory". It also ends on the primary selection (see below).
- "Restore from selection memory" (`selection-utilities.restoreAndClear`): This
  sets the current selection to the set of selections saved in memory. It also clears
  the memory.
- "Delete last saved selection" (`selection-utilities.deleteLastSaved`): This removes
  the last selection added to memory (a way to undo saving a selection to memory).

### Adding and removing selections

While VSCode comes with a way to add or remove multiple selections (Ctrl/Cmd - D) the
following commands provide a bit more flexibility in this behavior by introducing the notion
of a "primary" selection. You can remove the primary selection and you can add new
selections relative to this primary selection.

The primary selection also changes how selections are canceled and restored from memory: on
a restore the primary selection is always the selection closest to the current cursor
position. On a cancel, the cursor is placed at the location of the primary selection.

- "Move primary selection left" (`selection-utilities.movePrimaryLeft`): Make the
  selection to the left (or above) primary.
- "Move primary selection right" (`selection-utilities.movePrimaryRight`): Make the
  selection to the right (or below) primary.
- "Focus view on primary selection" (`selection-utilities.focusPrimarySelection`): Change
  the view of the current editor so that the active position of the primary selection is
  visible.
- "Delete primary selection" (`selection-utilities.deletePrimary`): Delete the primary
  selection.
- "Add next match" (`selection-utilities.addNext`): Add the next text which matches the
  primary selection
- "Skip to next match" (`selection-utilities.skipNext`): Move the primary selection to the
  next match.
- "Add previous match" (`selection-utilities.addPrev`): Add the previous text which matches
  the primary selection
- "Skip to previous match" (`selection-utilities.skipPrev`): Move the primary selection to
  the previous match.

### Splitting/filtering selections

These commands split, create or filter selections according to tokens.

- "Split selection(s) by string" (`selection-utilities.splitBy`): Splits each selection,
  creating a new selection before and after each given string.
- "Split selection(s) by newline" (`selection-utilities.splitByNewline`): Like the default
  command in VSCode to split selections by lines, but maintains a selection for each line.
- "Split selection(s) by regular expression" (`selection-utilities.splitByRegex`): Splits
  each selection creating a new selection before and after each given string.
- "Create selections by string" (`selection-utilities.createBy`): For each existing selection
  create a new selection for each instance of the given string.
- "Create selections by regex" (`selection-utilities.createByRegex`): For each existing
  selection create a new selection for each instance of the given regular expression.
- "Include selections by..." (`selection-utilities.includeBy`): Remove any selections that
do not contain a match of the given string.
- "Exclude selections by..." (`selection-utilities.excludeBy`): Remove any
  selections that contain a match of the given string.
- "Include selections by... (regex)" (`selection-utilities.includeByRegex`): Remove any
  selections that do not contain a match of the given regular expression.
- "Exclude selections by... (regex)" (`selection-utilities.excludeByRegex`): Remove any
  selections that contain a match of the given regular expression.

### Shrinking selections

These commands modify the start and end of selections.

- "Trim selection to exclude whitespace at start/end" (`selection-utilities.trimSelectionWhitespace`): Self explanatory

### Editing Text by Selection

These commands modify selected text in various ways

- "Left align selections (using spaces)" (`selection-utilities.alignSelectionsLeft`):
  Insert spaces to the left of a selection so that the left side of the selections align.
- "Right align selections (using spaces)" (`selection-utilities.alignSelectionsRight`):
  Insert spaces to the left of a selection so that the right side of the selections align.
- "Trim whitespace at start/end of selection" (`selection-utilities.trimWhitespace`)

### Selection Motions

These commands allow the active selection to move by a particular unit (word, paragrpah
etc...). The advantage of using these motions over the built-in motions is that they move
the cursor *and* select the current unit. This allows kakaune-style sequencing of motion and
action commands.

First you have to define the units you wish to move the cursor by using `motionUnits`.

These are defined in your settings file (open with the command `Preferences:
Open Settings (JSON)`), using `selection-utilities-motionUnits`. This setting
is an array with entries containing a `name` and a `regex` value. Each regex is
compiled with the g and u flags (global search and unicode support). For
example, my settings include the following.

```json

"selection-utilities-motionUnits": [
    {"name": "WORD", "regex": "[^\\s]+"},
    {"name": "word", "regex": "([/\\p{L}][_\\p{L}0-9]*)|([0-9][0-9.]*)|((?<=[\\s\\r\\n])[^\\p{L}^\\s]+(?=[\\s\\r\\n]))"},
    {"name": "subword", "regex": "(\\p{L}[0-9\\p{Ll}]+)|(\\p{Lu}[\\p{Lu}0-9]+(?!\\p{Ll}))|(\\p{L})|(_+)|([^\\p{L}^\\s^0-9])|([0-9][0-9.]*)"},
    {"name": "subident", "regex": "(\\p{L}[0-9\\p{Ll}]+)|(\\p{Lu}[\\p{Lu}0-9]+(?!\\p{Ll}))|(\\p{L})|([0-9][0-9.]*)"},
    {"name": "number", "regex": "[0-9][0-9.]*"},
    {"name": "space", "regex": "\\s+"},
    {"name": "punctuation", "regex": "[^\\p{L}\\s]+"}
],

```

You can also define multi-line units; see below.


#### The `moveBy` command

The `moveby` command moves the cursor according to one of the regular expressions
you defined in your settings. It takes five optional arguments.

- `unit`: The name of the regex to move by. If not specified
the regex `\p{L}+` is used.
- `select`: Set to true if you want the motion to expand the current selection.
- `value`: The number of boundaries to move by. Negative values move left,
  positive move right. Defaults to 1.
- `boundary`: The boundaries to stop at when moving: this can be the `start`,
  `end` or `both` boundaries of the regex. Defaults to `start`.
- `selectWhole`: If specified, the behavior of this command changes. Instead of
  moving the cursor, it will create a selection at the specified
  boundaries of the regex currently under the cursor, unless it is already
  selected. If it is, the next such regex is selected.

For example to move the cursor to the start of the next number, (using the regex
definitions provided above), using `ctrl+#` you could define the following
command in your `keybindings.json` file.

```json
{
    "command": "vscode-custom-word-motions.moveby",
    "args": { "unit": "number" },
    "key": "ctrl+shift+3"
}
```

#### The `narrowTo` command

The `narrowto` command shrinks the current boundaries of the current selection
until it is directly at the given boundaries of the regular expression. It
takes four optional arguments.

- `unit`: The name of the regex to move by. If not specified
  the regex `\p{L}+` is used.
- `boundary`: The boundaries to consider when moving: this can be the `start`,
  `end` or `both` boundaries of the regex. Defaults to `start`.
- `then`: If the selection is already at the boundaries of `unit`, you can
  specify a second regex to narrow the selection by here.
- `thenBoundary`: The boundaries to use for `then` if different
from those specified for `boundary`.

For example, to narrow the boundaries of the selection to lie at non-white-space characters by
pressing `cmd+(` you could add the following to `keybindings.json`.

```json
{
    "command": "vscode-custom-word-motions.narrowto",
    "args": { "unit": "WORD" },
    "key": "shift+cmd+9",
}
```

#### Multi-line units

This extension now supports defining units for multi-line matches.

To use this feature change the unit entry to use `regexs` instead of `regex`.

If a single regular expression is provided, the match will occur to a contiguous series of
lines which all match that expression. If multiple expressions are provided, the match will
occur to a sequence of lines that match those expressions.

For instance, to select a group of contiguous non-whitespace lines with "cmd+shift+[" you
could add the following definition to preferences.

```json
"vscode-custom-word-motions.units": [
    {"name": "paragraph", "regexs": "\\S+"},
]
```

Then add the following definition to keybindings.json

```json
{
    "command": "vscode-custom-word-motions.moveby",
    "args": { "unit": "paragraph", "selectWhole": true },
    "key": "shift+cmd+9",
}
```

Or, for instance, you could selection sections of code separated by comment headers

```json
"vscode-custom-word-motions.units": [
    {"name": "section", "regexs": [".+", "^.*------.*$"]}
]"
```

Where a section header looks like this

```javascript
// My section
// -----------------------------------------------------------------
```

You could then select all code in the section using a keybinding like follows.

```json
{
    "command": "vscode-custom-word-motions.moveby",
    "args": { "unit": "section", "boundary": "start", "selectWhole": true },
    "key": "shift+cmd+0",
}
```

## Related projects

- [Dance](https://github.com/71/dance)
- [Piped Regex](https://github.com/akashsaluja/piped-regex-vscode)
- [Filter Lines](https://github.com/everettjf/vscode-filter-line)
- [Better Align](https://github.com/WarWithinMe/better-align)