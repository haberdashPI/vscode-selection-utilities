# Selection Utilities

[![Project Status: Active – The project has reached a stable, usable state and is being actively developed.](https://img.shields.io/badge/Project%20Status-Active-green)](https://www.repostatus.org/#active)
[![CI](https://github.com/haberdashPI/vscode-selection-utilities/actions/workflows/ci.yml/badge.svg)](https://github.com/haberdashPI/vscode-selection-utilities/actions/workflows/ci.yml)
[![Code Style: Google](https://img.shields.io/badge/code%20style-google-blueviolet)](https://github.com/google/gts)

> [!WARNING] 🚧 documentation under construction 🚧
> The documentation for selection utilities is under construction. The [older docs](https://haberdashpi.github.io/vscode-selection-utilities/stable/README.html) are currently accurate, but are missing some new commands, and upcoming updates may change some of the names of commands and their arguments

This extension provides a series of utilities for manipulating, saving and creating both single and multiple selections, many of which are inspired by [Kakoune](http://kakoune.org/).

There are many commands, and they are designed to work together. They work well in conjunction with [Master Key](https://github.com/haberdashPI/vscode-master-key). In particular the Larkin presets available in Master Key make extensive use of all features from this extension.

The easiest way to learn about Selection Utilities is to use it in conjection with Master Keys. Otherwise, because there are so many commands, and any given set of keybindings for this extension could easily overwrite existing bindings, there are no default keybindings; you will need to learn about commands you want to use and then customize them yourself for your own purpose.

## Commands

### Changing the Active and Anchor positions of a Selection

![Exchange anchor animation](./docs/images/exchange_anchor.gif)

[Read more](https://haberdashpi.github.io/vscode-selection-utilities/stable/exchange.html)

### Selection Motions

![Subword Selection Animation](./docs/images/subword_select.gif)

These commands allow the active selection to moved by or extend by particular units (word,
paragrpah etc...).

[Read more](https://haberdashpi.github.io/vscode-selection-utilities/stable/motions.html)

### Saving selections

These commands save a selection for later, or add any arbitrary selection to a list of
soon-to-be multiple selections.

![Saved Selection Animation](./docs/images/save_selection.gif)

[Read more](https://haberdashpi.github.io/vscode-selection-utilities/stable/saving.html)

### Adding and removing selections

While VSCode comes with a way to add or remove multiple selections (Ctrl/Cmd - D) the
following commands provide a bit more flexibility in this behavior by introducing the notion
of a "primary" selection. You can remove the primary selection and you can add new
selections relative to this primary selection.

![Move primary selection and delete cursor animation](./docs/images/move_primary_and_delete_cursor.gif)

[Read more](https://haberdashpi.github.io/vscode-selection-utilities/stable/primary.html)

### Splitting/filtering selections

These commands split, create or filter selections according to tokens. The tokens to use can be provided by the user via an input box, or you can pass it in the argument `text` when defining the command to call.

![Filter selection animation](./docs/images/filter_selections_by.gif)
![Split selection animation](./docs/images/split_selection_by.gif)


[Read more](https://haberdashpi.github.io/vscode-selection-utilities/stable/split_filter.html)

### Shrinking selections

These commands modify the start and end of selections.

![Symmetric motions animation](./docs/images/symmetric_motion.gif)

[Read more](https://haberdashpi.github.io/vscode-selection-utilities/stable/shrink.html)

### Editing Text by Selection

![Align Selection animation](./docs/images/align_selections.gif)
![Symmetric Insertion animation](./docs/images/symmetric_insertion.gif)

[Read more](https://haberdashpi.github.io/vscode-selection-utilities/stable/edit_text.html)

## Related projects

- [Dance](https://github.com/71/dance)
- [Piped Regex](https://github.com/akashsaluja/piped-regex-vscode)
- [Filter Lines](https://github.com/everettjf/vscode-filter-line)
- [Better Align](https://github.com/WarWithinMe/better-align)
