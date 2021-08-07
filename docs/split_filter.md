### Splitting/filtering selections

These commands split, create or filter selections according to tokens. The tokens to use can be provided by the user via an input box, or you can pass it in the argument `text` when defining the command to call.

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
