# Saving selections

These commands save a selection for later, or add any arbitrary selection to a list of
soon-to-be multiple selections. 

Saved selections can also be used to exchange the position
of two regions of text. Saved selections are displayed in the editor using a distinct color.

All of the commands that recall or store from memory take an optional argument, `register`,
which is a string that names a specific memory register. If not specified, the "default"
memory register is used. Only the default register is displayed on screen.

- "Save to selection memory" (`selection-utilities.appendToMemory`): this appends the
  current word under the cursor or the current selection(s) to a memory of past selections.
- "Swap current selections with saved selections (or save current selections)"
  (`selection-utilities.swapWithMemory`): this can be used to quickly exchange text; if no
  selections are currently saved, this will have the same effect as "Save to selection
  memory". Otherwise, it will swap the currently selected text (or word under the cursor)
  with the text of the save selection. In the case of multiple selections there must be as
  many saved selections as current selections.
- "Cancel Selection (end on primary)" (`selection-utilities.cancelSelection`): This behaves
  much like the default `cancelSelection` command, but it saves the cancled selection to a
  memory named "cancel" which can be restored using "Restore from selection memory". It also
  ends on the primary selection (see below).
- "Restore from selection memory" (`selection-utilities.restoreAndClear`): This sets the
  current selection to the set of selections saved in memory. It also clears the memory.
- "Delete last saved selection" (`selection-utilities.deleteLastSaved`): This removes the
  last selection added to memory (a way to undo saving a selection to memory).

