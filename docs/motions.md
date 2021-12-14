# Selection Motions

There are two advantages to these motions over the built-in motions

- They are highly customizable via regex
- They allow for kakoune-like workflows, because both the end and start of a selection
can move by a given unit (e.g. move selection so it surrounds *just* the next word).

Below are the pre-defined motions, all of which can be customized. For ultimate flexiblity, you can use the generic [`moveby`](#the-custom-moveby-command) command. Below, the "Move Selection"
commands adjust both the start and end of the selection while the "Select to" commands only
change the end or start of the selection, depending on the location of the anchor. The units
are defined by regex's (listed below).

- "Move Selection to Next Subword": `selection-utilities.moveToNextSubword`
- "Select to Next Subword": `selection-utilities.selectToNextSubword`
- "Move Selection to Next Word": `selection-utilities.moveToNextWord`
- "Select to Next Word": `selection-utilities.selectToNextWord`
- "Move Selection to Next non-whitespace characters": `selection-utilities.moveToNextWORD`
- "Select to Next non-whitespace characters": `selection-utilities.selectToNextWORD`
- "Move Selection to Next Paragraph": `selection-utilities.moveToNextParagraph`
- "Select to Next Paragraph": `selection-utilities.selectToNextParagraph`
- "Move Selection to Next Subsection": `selection-utilities.moveToNextSubsection`
- "Select to Next Subsection": `selection-utilities.selectToNextSubsection`
- "Move Selection to Next Section": `selection-utilities.moveToNextSection`
- "Select to Next Section": `selection-utilities.selectToNextSection`
- "Move Selection to Previous Subword": `selection-utilities.moveToPreviousSubword`
- "Select to Subword": `selection-utilities.selectToPreviousSubword`
- "Move Selection to Previous Word": `selection-utilities.moveToPreviousWord`
- "Select to Word": `selection-utilities.selectToPreviousWord`
- "Move Selection to Previous non-whitespace characters": `selection-utilities.moveToPreviousWORD`
- "Select to non-whitespace characters": `selection-utilities.selectToPreviousWORD`
- "Move Selection to Previous Paragraph": `selection-utilities.moveToPreviousParagraph`
- "Select to Paragraph": `selection-utilities.selectToPreviousParagraph`
- "Move Selection to Previous Subsection": `selection-utilities.moveToPreviousSubsection`
- "Select to Subsection": `selection-utilities.selectToPreviousSubsection`
- "Move Selection to Previous Section": `selection-utilities.moveToPreviousSection`
- "Select to Section": `selection-utilities.selectToPreviousSection`


## Custom Motions

First you have to define the units you wish to move the cursor by using `motionUnits`.

These are defined in your settings file (open with the command `Preferences:
Open Settings (JSON)`), using `selection-utilities.motionUnits`. This setting
is an array with entries containing a `name` and a `regex` value. Each regex is
compiled with the g and u flags (global search and unicode support). The default units are
listed below.

```json

"selection-utilities-motionUnits": [
    { "name": "WORD", "regex": "[^\\s]+" },
    { "name": "word", "regex": "(_*[\\p{L}][_\\p{L}0-9]*)|(_+)|([0-9][0-9.]*)|((?<=[\\s\\r\\n])[^\\p{L}^\\s]+(?=[\\s\\r\\n]))" },
    { "name": "subword", "regex": "(_*[\\p{L}][0-9\\p{Ll}]+_*)|(_+)|(\\p{Lu}[\\p{Lu}0-9]+_*(?!\\p{Ll}))|(\\p{L})|([^\\p{L}^\\s^0-9])|([0-9][0-9.]*)" },
    { "name": "paragraph", "regexs": "\\S+" },
    { "name": "section", "regexs": [ ".+", "^.*========+.*$" ] },
    { "name": "subsection", "regexs": [ ".+", "^.*(========+|--------+).*$" ] }
],
```

Motion units can be customized on a per-langauge basis, if desired.

For the built-in motions to work, all of these motions have to be defined, but you can also
define your own custom units.

Note that some of the units employ multi-line matches using `regexs` instead of `regex`. For
more on how to define multi-line units, see the final subsection below.

### The custom `moveBy` command

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
  selected. If it is, the next such regex is selected. If abs(value) > 1
  it will select multiple units.
- `selectOneUnit`: When `selectWhole` is true, this changes the behavior of `value`. When set to true, only one unit is ever selected and abs(value) > 1 changes the location of the unit that gets selected, rather than how many units are selected.

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

### The `narrowTo` command

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

## Multi-line units

The units can work for multi-line matches. To use this feature, change the unit entry to use `regexs` instead of `regex`.

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

Or, for instance, you could select sections of code separated by comment headers

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
