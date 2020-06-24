# Selection Utilities

This provides a series of utilities for manipulating, saving and creating multiple
selections, inspired by [Kakoune](http://kakoune.org/). This is an extension that I use
daily, so it is in good working order.

I use these commands mostly in conjunction with a [modified version](https://github.com/johtela/vscode-modaledit/pull/16) of [vscode-modaledit](https://johtela.github.io/vscode-modaledit/docs/tutorial.html).

There are many commands, and they are designed to work in conjunction with one another.

## Commands

### Cursor Position

These commands enable each cursors' position to be changed relative to the associated
selection. The cursor is the "active" position and the other end of a selection is the
"anchor".

- "Exchange active and anchor" (`selection-utilities.exchange-anchor-active`)
- "Active to end" (`selection-utilities.active-at-end`)
- "Active to start" (`selection-utilities.active-at-start`)

### Saving selections

Sometimes it can be helpful to save a selection for later, or add any arbitrary selection to
a list of soon-to-be multiple selections. Saved selections can also be used to exchange the
position of two regions of text. The following commands manipulate or recall from a memory
a set of selections. Saved selections are displayed in the editor using a distinct color.

All of the commands that recall or store from memory take an optional argument `register`
which is a string that names a specific memory register. If not specified, the "default"
memory register is used. Only the default register is displayed.

- "Save to selection memory" (`selection-utilities.append-to-memory`): this appends the
  current word under the cursor or the current selection(s) to a memory of past selections.
- "Swap current selections with saved selections (or save current selections)" (`selection-utilities.swap-with-memory`): this can be used to quickly exchange text; if no selections are
  currently saved, this will have the same effect as "Save to selection memory". Otherwise,
  it will swap the currently selected text (or word under the cursor) with the text
  of the save selection. In the case of multiple selections there must be as many saved
  selections as current selections.
- "Cancel Selection (end on primary)" (`selection-utilities.cancel-selection`):
  This behaves much like the default `cancelSelection` command, but it saves the
  cancled selection to a memory named "cancel" which can be restored using "Restore from selection memory". It also ends on the primary selection (see below).
- "Restore from selection memory" (`selection-utilities.restore-and-clear`): This
  sets the current selection to the set of selections saved in memory. It also clears
  the memory.
- "Delete last saved selection" (`selection-utilities.delete-last-saved`): This removes
  the last selection added to memory (a way to undo saving a selection to memory).

### Adding and removing selections

While VSCode comes with a way to add or remove multiple selections (Ctrl/Cmd - D) the
following commands provide a bit more flexibility in this behavior by introducing the notion
of a "primary" selection. You can remove the primary selection and you can add new
selections relative to this primary selection.

The primary selection also changes how selections are canceled and restored from memory: on
a restore the primary selection is always the selection closest to the current cursor
position. On a cancel, the cursor is placed at the location of the primary selection.

- "Move primary selection left" (`selection-utilities.move-primary-left`): Make the selection to the left (or below) primary.
- "Move primary selection right" (`selection-utilities.move-primary-right`): Make the selection
to the right (or above) primary.
- "Delete primary selection" (`selection-utilities.delete-primary`): Delete the primary
selection.
- "Add next match" (`selection-utilities.add-next`): Add the next text which matches
the primary selection
- "Skip to next match" (`selection-utilities.skip-next`): Move the primary selection to the
next match.

### Splitting/filtering selections

These commands split, create or filter selections according to tokens.

- "Split selection(s) by string" (`selection-utilities.split-by`): Splits each selection,
  creating a new selection before and after each given string.
- "Split selection(s) by newline" (`selection-utilities.split-by-newline`): Like the default
  command in VSCode to split selections by lines, but maintains a selection for each line.
- "Split selection(s) by regular expression" (`selection-utilities.split-by-regex`): Splits
  each selection creating a new selection before and after each given string.
- "Create selections by string" (`selection-utilities.create-by`): For each existing selection
  create a new selection for each instance of the given string.
- "Create selections by regex" (`selection-utilities.create-by-regex`): For each existing
  selection create a new selection for each instance of the given regular expression.
- "Include selections by..." (`selection-utilities.include-by`): Remove any selections that
do not contain a match of the given string.
- "Exclude selections by... (regex)" (`selection-utilities.exclude-by`): Remove any
  selections that contain a match of the given string.
- "Include selections by..." (`selection-utilities.include-by-regex`): Remove any
  selections that do not contain a match of the given regular expression.
- "Exclude selections by... (regex)" (`selection-utilities.exclude-by-regex`): Remove any
  selections that contain a match of the given regular expression.

### Aligning Selections

These commands insert spaces to align text to the left or right.

- "Left align selections (using spaces)" (`selection-utilities.align-selections-left`):
  Insert spaces to the left of a selection so that the left side of the selections align.
- "Right align selections (using spaces)" (`selection-utilities.align-selections-right`):
  Insert spaces to the left of a selection so that the right side of the selections align.

## Roadmap

- A GIF in the README demonstrating each command.
- Provide a set of keyboard shortcuts for users of ModalEdit
- Provide a set of keyboard shortcuts for those not using ModalEdit

## Related projects

- [Dance](https://github.com/71/dance)
- [Piped Regex](https://github.com/akashsaluja/piped-regex-vscode)
- [Filter Lines](https://github.com/everettjf/vscode-filter-line)
- [Better Align](https://github.com/WarWithinMe/better-align)