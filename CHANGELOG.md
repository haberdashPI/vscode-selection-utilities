# Change Log

## [0.5.1]
- **Feature**: `revealActive` reveal the active position of the primary cursor

## [0.5.0]
- **Feature**: `shrinkToActive` shrinks selections to the active cursor position
- **Feature**: `expandWithinBrackets` expands selection to be within the next widest brackets
- **Feature**: `expandAroundBrackets` expands selection to be around the next widest brackets

## [0.4.2]
- **Bugfix**: default motion commands previously errored (only custom `moveBy` commands worked correctly); the commands are now functional

## [0.4.1]
- **Bugfix**: package was poorly compimled in 0.4.0 for web, which could lead to weird errors about gargabe functions not existing; revised build environment.

## [0.4.0]
- **Feature**: Selection Utilities now supports vscode.dev

## [0.3.0]

- **Feature**: `selectOneUnit` can be used to change behavior of unit motions
that use `selectWhole`.
- **Bugfix**: fixed some `narrowTo` edge cases
- **Bugfix**: fixed `selectWhole` issues when unit is multi-line and multi-regex (boundaries were not correctly identified)
- **Bugfix**: resolved some upstream vulnerabilities
- **Refactor**: cleaned-up code for unit motions (hopefully architecture will be less buggy and slow more generally)

## [0.2.1]
- **Docs**: Fix broken link

## [0.2.0]
- **Docs**: gif examples, and published content on gh-pages; command names are now stable.
- **Bugfix**: failure in symmetric motion across lines

## [0.1.10]
- **Feature**: Splitting / creating / filtering commands now accept
a command argument `text` as an alternative to opening an input dialog.

## [0.1.9]
- **Bufix**: downstream vulnerabilities

## [0.1.8]
- **Feature**: New symmetric (start/end of selection) commands:
    - Add a character before/after selections
    - Remove characters before/after selections
    - Adjust selection ends both inwards/outwards

## [0.1.7]
- **Bugfix**: downstream vulnerabilities fixed

## [0.1.6]
- **Feature**: Command to clear a given memory (without restoring it).

## [0.1.5]
- **Bugfix**: updates to fix downstream vulnerabilities

## [0.1.4]
- **Bugfix**: overextended split-by selections
- **Bugfix**: unit selection near the end of a file

## [0.1.3]
- **Bugfix**: edge case for multi-line "both" boundaries

## [0.1.2]
- **Feature**: word motions are now customizable per-langauge

## [0.1.1]
- **Feature**: Added selection motions (taken from custom word motion extension).

## [0.1.0]
***BREAKING CHANGES***
- **Renamed Commands/Preferences**: switched to camel case
- **Preformance**: now using parcel to bundle the extension

## [0.0.12]
- **Bugfix**: correct command names for regex filters

## [0.0.11]
- **Feature**: skip to/add previous match to selections

## [0.0.10]
- **Feature**: delete whitespace around a selection
- **Feature**: shrink selection to remove whitespace

## [0.0.9]
- **Bugfix**: skip to next match works with more selection condittions

## [0.0.8]
- **Bugfix**: dependency upgrade to avoid vulnerabilities

## [0.0.7]
- **Bugfix**: proper handling of column alignment when rows have a different number of columns

## [0.0.6]
- **Bugfix**: proper handling of document end when splitting selections

## [0.0.5]
- **Bufgix**: gracefully handle 0 matches for skip-next and add-next commands

## [0.0.4]
- **Bugfix**: gracefully handle empty search results for `create-by` commands.

## [0.0.3]
- **New command**: Focus view on primary selection.

## [0.0.2]
- **Saved/primary selection colors are customizable**

## [0.0.1]

Initial release
