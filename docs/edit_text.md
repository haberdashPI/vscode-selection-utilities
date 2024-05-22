### Editing Text by Selection

- "Left align selections (using spaces)" (`selection-utilities.alignSelectionsLeft`):
  Insert spaces to the left of a selection so that the left side of the selections align.
- "Right align selections (using spaces)" (`selection-utilities.alignSelectionsRight`):
  Insert spaces to the left of a selection so that the right side of the selections align.
- "Trim whitespace at start/end of selection" (`selection-utilities.trimWhitespace`)
- "Delete characters at start end of selections" (`selection-utilities.deleteAround).
  `followCursor` will cause the selection to expand depending on the location of the cursor
- "Insert characters around selections" (`selection-utilities.insertAround`), takes two arguments: `before` and `after` which should include the characters that should be placed before and after each selection. Set `expandWith` for the selection to expand to include
the inserted characters, or `followCursor` to have the insertion point follow the location of the cursor (i.e. expandWith only when selection is not reversed).
