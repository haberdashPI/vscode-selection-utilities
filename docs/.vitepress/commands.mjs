export const commands = [
    {
        text: 'Active Cursor Motions',
        items: [
            {text: 'exchangeAnchorActive', link: '/commands/exchangeAnchorActive.md'},
            {text: 'activeAtEnd', link: '/commands/activeAtEnd.md'},
            {text: 'activeAtStart', link: '/commands/activeAtStart.md'},
            {text: 'shrinkToActive', link: '/commands/shrinkToActive.md'},
            {text: 'revealActive', link: '/commands/revealActive.md'},
            {text: 'activePageMove', link: '/commands/activePageMove.md'},
        ]
    },
    {
        text: 'Multiselection Primitives',
        items: [
            {text: 'movePrimaryLeft', link: '/commands/movePrimaryLeft.md'},
            {text: 'movePrimaryRight', link: '/commands/movePrimaryRight.md'},
            {text: 'focusPrimarySelection', link: '/commands/focusPrimarySelection.md'},
            {text: 'appendToMemory', link: '/commands/appendToMemory.md'},
            {text: 'restoreAndClear', link: '/commands/restoreAndClear.md'},
            {text: 'swapWithMemory', link: '/commands/swapWithMemory.md'},
            {text: 'cancelSelection', link: '/commands/cancelSelection.md'},
            {text: 'deleteLastSaved', link: '/commands/deleteLastSaved.md'},
            {text: 'deletePrimary', link: '/commands/deletePrimary.md'},
            {text: 'addNext', link: '/commands/addNext.md'},
            {text: 'skipNext', link: '/commands/skipNext.md'},
            {text: 'addPrev', link: '/commands/addPrev.md'},
            {text: 'skipPrev', link: '/commands/skipPrev.md'},
        ]
    },
    {
        text: 'Selection Filters',
        items: [
            {text: 'includeBy', link: '/commands/includeBy.md'},
            {text: 'excludeBy', link: '/commands/excludeBy.md'},
            {text: 'includeByRegex', link: '/commands/includeByRegex.md'},
            {text: 'excludeByRegex', link: '/commands/excludeByRegex.md'},
        ]
    },
    {
        text: 'Unit Motions',
        items: [
            {text: 'moveBy', link: '/commands/moveBy.md'},
            {text: 'narrowTo', link: '/commands/narrowTo.md'},
            {text: 'moveCursorToNextSubword', link: '/commands/moveCursorToNextSubword.md'},
            {text: 'moveToNextSubword', link: '/commands/moveToNextSubword.md'},
            {text: 'selectToNextSubword', link: '/commands/selectToNextSubword.md'},
            {text: 'moveCursorToNextWord', link: '/commands/moveCursorToNextWord.md'},
            {text: 'moveToNextWord', link: '/commands/moveToNextWord.md'},
            {text: 'selectToNextWord', link: '/commands/selectToNextWord.md'},
            {text: 'moveCursorToNextWORD', link: '/commands/moveCursorToNextWORD.md'},
            {text: 'moveToNextWORD', link: '/commands/moveToNextWORD.md'},
            {text: 'selectToNextWORD', link: '/commands/selectToNextWORD.md'},
            {text: 'moveCursorToNextParagraph', link: '/commands/moveCursorToNextParagraph.md'},
            {text: 'moveToNextParagraph', link: '/commands/moveToNextParagraph.md'},
            {text: 'selectToNextParagraph', link: '/commands/selectToNextParagraph.md'},
            {text: 'moveCursorToNextSubsection', link: '/commands/moveCursorToNextSubsection.md'},
            {text: 'moveToNextSubsection', link: '/commands/moveToNextSubsection.md'},
            {text: 'selectToNextSubsection', link: '/commands/selectToNextSubsection.md'},
            {text: 'moveCursorToNextSection', link: '/commands/moveCursorToNextSection.md'},
            {text: 'moveToNextSection', link: '/commands/moveToNextSection.md'},
            {text: 'selectToNextSection', link: '/commands/selectToNextSection.md'},
            {text: 'moveCursorToPreviousSubword', link: '/commands/moveCursorToPreviousSubword.md'},
            {text: 'moveToPreviousSubword', link: '/commands/moveToPreviousSubword.md'},
            {text: 'selectToPreviousSubword', link: '/commands/selectToPreviousSubword.md'},
            {text: 'moveCursorToPreviousWord', link: '/commands/moveCursorToPreviousWord.md'},
            {text: 'moveToPreviousWord', link: '/commands/moveToPreviousWord.md'},
            {text: 'selectToPreviousWord', link: '/commands/selectToPreviousWord.md'},
            {text: 'moveCursorToPreviousWORD', link: '/commands/moveCursorToPreviousWORD.md'},
            {text: 'moveToPreviousWORD', link: '/commands/moveToPreviousWORD.md'},
            {text: 'selectToPreviousWORD', link: '/commands/selectToPreviousWORD.md'},
            {text: 'moveCursorToPreviousParagraph', link: '/commands/moveCursorToPreviousParagraph.md'},
            {text: 'moveToPreviousParagraph', link: '/commands/moveToPreviousParagraph.md'},
            {text: 'selectToPreviousParagraph', link: '/commands/selectToPreviousParagraph.md'},
            {text: 'moveCursorToPreviousSubsection', link: '/commands/moveCursorToPreviousSubsection.md'},
            {text: 'moveToPreviousSubsection', link: '/commands/moveToPreviousSubsection.md'},
            {text: 'selectToPreviousSubsection', link: '/commands/selectToPreviousSubsection.md'},
            {text: 'moveCursorToPreviousSection', link: '/commands/moveCursorToPreviousSection.md'},
            {text: 'moveToPreviousSection', link: '/commands/moveToPreviousSection.md'},
            {text: 'selectToPreviousSection', link: '/commands/selectToPreviousSection.md'},
        ]
    },
    {
        text: 'Selection Editing',
        items: [
            {text: 'trimSelectionWhitespace', link: '/commands/trimSelectionWhitespace.md'},
            {text: 'splitByNewline', link: '/commands/splitByNewline.md'},
            {text: 'splitBy', link: '/commands/splitBy.md'},
            {text: 'splitByRegex', link: '/commands/splitByRegex.md'},
            {text: 'createBy', link: '/commands/createBy.md'},
            {text: 'createByRegex', link: '/commands/createByRegex.md'},
        ]
    },
    {
        text: 'Number Editing',
        items: [
            {text: 'incrementNumber', link: '/commands/incrementNumber.md'},
            {text: 'decrementNumber', link: '/commands/decrementNumber.md'},
            {text: 'incrementNumberPerSelection', link: '/commands/incrementNumberPerSelection.md'},
            {text: 'decrementNumberPerSelection', link: '/commands/decrementNumberPerSelection.md'},
        ]
    },
    {
        text: 'Selection Alignment',
        items: [
            {text: 'alignSelectionsLeft', link: '/commands/alignSelectionsLeft.md'},
            {text: 'alignSelectionsRight', link: '/commands/alignSelectionsRight.md'},
        ]
    },
    {
        text: 'Symmetric Editing',
        items: [
            {text: 'insertAround', link: '/commands/insertAround.md'},
            {text: 'deleteAround', link: '/commands/deleteAround.md'},
            {text: 'selectBetween', link: '/commands/selectBetween.md'},
            {text: 'adjustSelections', link: '/commands/adjustSelections.md'},
            {text: 'expandWithinBrackets', link: '/commands/expandWithinBrackets.md'},
            {text: 'expandAroundBrackets', link: '/commands/expandAroundBrackets.md'},
        ]
    }
]
