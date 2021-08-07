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

