# Change Log

## [0.1.9]
- **Bufx**: downstream vulnerabilities

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
