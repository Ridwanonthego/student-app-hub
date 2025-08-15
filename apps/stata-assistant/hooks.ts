import { useState, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { CodeCell, EditorHistory } from './types';

export const useEditorState = (initialCells: CodeCell[]) => {
    const [cells, setCells] = useState<CodeCell[]>(initialCells);
    const [history, setHistory] = useState<EditorHistory[]>([{ cells: initialCells, cursorPosition: null }]);
    const [historyIndex, setHistoryIndex] = useState(0);

    const updateHistory = (newCells: CodeCell[], currentCells: CodeCell[]) => {
        // Only update history if cells have actually changed
        if (JSON.stringify(newCells) === JSON.stringify(currentCells)) {
            return;
        }
        const newHistoryEntry = { cells: newCells, cursorPosition: null };
        const newHistory = [...history.slice(0, historyIndex + 1), newHistoryEntry];
        setHistory(newHistory);
        setHistoryIndex(newHistory.length - 1);
    };

    const handleSetCells = (newCellsOrCallback: React.SetStateAction<CodeCell[]>) => {
        setCells(prevCells => {
            const newCells = typeof newCellsOrCallback === 'function'
                ? newCellsOrCallback(prevCells)
                : newCellsOrCallback;
            updateHistory(newCells, prevCells);
            return newCells;
        });
    };
    
    const undo = useCallback(() => {
        if (historyIndex > 0) {
            const newIndex = historyIndex - 1;
            setHistoryIndex(newIndex);
            setCells(history[newIndex].cells);
        }
    }, [history, historyIndex]);

    const canUndo = historyIndex > 0;
    
    const splitCodeIntoCells = (code: string): CodeCell[] => {
        if (!code.trim()) return [{ id: uuidv4(), content: '' }];
        // Split by one or more blank lines
        const chunks = code.split(/(\r\n|\n\r|\r|\n){2,}/g).filter(c => c && !c.match(/^(\r\n|\n\r|\r|\n)+$/));
        const newCells = chunks.map(chunk => ({ id: uuidv4(), content: chunk.trim() })).filter(cell => cell.content);
        return newCells.length > 0 ? newCells : [{ id: uuidv4(), content: '' }];
    };

    return { cells, setCells: handleSetCells, undo, canUndo, splitCodeIntoCells };
};
