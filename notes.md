We need both tree-sitter-api and this extension to be the same kind of extension.

Start by making this extension a desktop extension (just to get things going)
and then start creating a PR to move tree-sitter-api to a web *and* desktop extension
(I pretty sure it needs to be both to be available to both types of extensions)

WIP bindings
```json
[
    {
        "key": "ctrl+h",
        "command": "selection-utilities.moveBySyntaxNode",
        "args": {
            "unit": "sibling",
            "selectWhole": true,
            "named": true,
            "value": -1,
            "boundary": "both"
        }
    },

    {
        "key": "ctrl+j",
        "command": "selection-utilities.moveBySyntaxNode",
        "args": {
            "unit": "level",
            "selectWhole": true,
            "named": true,
            "value": 1,
            "boundary": "both"
        }
    },

    {
        "key": "ctrl+k",
        "command": "selection-utilities.moveBySyntaxNode",
        "args": {
            "unit": "level",
            "selectWhole": true,
            "named": true,
            "value": -1,
            "boundary": "both"
        }
    },

    {
        "key": "ctrl+l",
        "command": "selection-utilities.moveBySyntaxNode",
        "args": {
            "unit": "sibling",
            "selectWhole": true,
            "named": true,
            "value": 1,
            "boundary": "both"
        }
    },
]
```
