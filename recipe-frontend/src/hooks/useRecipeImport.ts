import React, { useState } from 'react';
import axios from 'axios';
import * as api from '../api/recipesApi';

interface ImportCallbacks {
    refreshRecipes: () => void;
    clearSelection: () => void;
    setError: (message: string | null) => void;
}

const importErrorMessage = (error: unknown): string => {
    if (axios.isAxiosError<{ error?: string }>(error)) {
        const data: unknown = error.response?.data;
        if (typeof data === 'string') {
            if (data.trim()) return data;
        } else if ((data as { error?: string } | undefined)?.error) {
            return (data as { error: string }).error;
        }
    }
    return 'Failed to import recipes. Please check the file format and try again.';
};

export function useRecipeImport({ refreshRecipes, clearSelection, setError }: ImportCallbacks) {
    const [file, setFile] = useState<File | null>(null);
    const [pendingFile, setPendingFile] = useState<File | null>(null);
    const [isPromptOpen, setIsPromptOpen] = useState(false);
    const [warnings, setWarnings] = useState<string[]>([]);

    const deleteExistingRecipes = async (): Promise<boolean> => {
        try {
            const existing = await api.fetchRecipes(true);
            const ids = [...new Set(existing.map(recipe => recipe.id))];
            if (ids.length > 0) {
                await api.deleteRecipes(ids);
                clearSelection();
            }
            return true;
        } catch (error) {
            console.error('Error deleting recipes before import:', error);
            setError('Failed to delete existing recipes before import. Import was cancelled.');
            return false;
        }
    };

    const runImport = async (fileToImport: File, deleteFirst: boolean) => {
        if (deleteFirst && !await deleteExistingRecipes()) return;

        setWarnings([]);
        try {
            const data = await api.importRecipes(fileToImport);
            const imported = Array.isArray(data) ? data : data?.recipes;
            const importedCount = Array.isArray(imported) ? imported.length : 0;
            setWarnings(Array.isArray(data?.warnings) ? data.warnings : []);

            if (importedCount === 0) {
                setError('Import completed but no recipes were detected. Ensure rows contain markers like Recipe/Ingredient/Source.');
            } else {
                console.log(`Import completed: ${importedCount} recipe(s) imported.`);
                setFile(null);
                setError(null);
                const fileInput = document.getElementById('csvFileInput') as HTMLInputElement | null;
                if (fileInput) fileInput.value = '';
            }
        } catch (error: unknown) {
            console.error('Error importing recipes:', error);
            setError(importErrorMessage(error));
        }
        refreshRecipes();
    };

    const requestImport = (event: React.FormEvent) => {
        event.preventDefault();
        if (!file) {
            alert('Please select a CSV, text, or Excel file to import.');
            return;
        }
        setPendingFile(file);
        setIsPromptOpen(true);
    };

    const confirmImport = async (deleteFirst: boolean) => {
        if (!pendingFile) return;
        setIsPromptOpen(false);
        await runImport(pendingFile, deleteFirst);
        setPendingFile(null);
    };

    return {
        file,
        setFile,
        warnings,
        isPromptOpen,
        requestImport,
        importAfterDeleting: () => confirmImport(true),
        importKeepingExisting: () => confirmImport(false),
    };
}
