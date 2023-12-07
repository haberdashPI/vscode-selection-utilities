### Shrinking selections

These commands modify the start and end of selections.

- "Trim selection to exclude whitespace at start/end" (`selection-utilities.trimSelectionWhitespace`): Self explanatory
- "Adjust selection boundaries inwards or outwards" (`selection-utilities.adjustSelections`): Expands or shrinks the selection by individual characters. Takes two arguments, dir ("forward" or "backward") and count (how many characters to adjust).
- "Shrink to active" (`selection-utilities.shrinkToActive`): the anchor of each selection
  is moved to the active position, shrinking the selection to a length of zero.
