### Shrinking selections

These commands modify the start and end of selections.

- "Trim selection to exclude whitespace at start/end" (`selection-utilities.trimSelectionWhitespace`): Self explanatory
- "Adjust selection boundaries inwards or outwards" (`selection-utilities.adjustSelections`): Expands or shrinks the selection by individual characters. Takes two arguments, dir ("forward" or "backward") and count (how many characters to adjust).
- "Shrink to active" (`selection-utilities.shrinkToActive`): the anchor of each selection
  is moved to the active position, shrinking the selection to a length of zero.
- "Expand selection to be within next surrounding brackets" (`selection-utilities. 
  expandWithinBrackets`) With no selection expands the selection to be within the brackets
  surrounding each cursor. If such a region is already selected, a subsequent call
  will expand to the next widest surrounding set of brackets.
- "Expand selection to be around next surrounding brackets" (`selection-utilities. 
  expandAroundBrackets`) With no selection expands the selection to be around the brackets
  surrounding each cursor. If such a region is already selected, a subsequent call
  will expand to the next widest surrounding set of brackets.
