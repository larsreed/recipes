import React, { useState, useEffect, useCallback, useRef, Suspense, lazy } from 'react';
import Modal from 'react-modal';
import PromptDialog from './PromptDialog.tsx';
import RecipeTable from './RecipeTable.tsx';
import * as api from '../api/recipesApi';
import { buildRecipesHtml, buildShoppingListHtml, downloadHtml, openInNewWindow } from '../export/htmlExport';
import { promptGuests } from '../export/scaling';
import { exportToWord } from '../export/word/wordExport';
import { useDisclosure } from '../hooks/useDisclosure';
import { useRecipeImport } from '../hooks/useRecipeImport';
import { useRecipeSort } from '../hooks/useRecipeSort';
import type { Recipe } from '../types';

Modal.setAppElement('#root');

const ConversionsModal = lazy(() => import('./ConversionsModal.tsx'));
const SourceModal = lazy(() => import('./SourceModal.tsx'));
const TemperaturesModal = lazy(() => import('./TemperaturesModal.tsx'));
const RecipeModal = lazy(() => import('./RecipeModal.tsx'));

const filterByCategory = (recipes: Recipe[], category: string) =>
    category
        ? recipes.filter(recipe => recipe.categories.split(',').map(cat => cat.trim()).includes(category))
        : recipes;

function RecipeList() {
    const [allRecipes, setAllRecipes] = useState<Recipe[]>([]);
    const [recipes, setRecipes] = useState<Recipe[]>([]);
    const [selectedRecipes, setSelectedRecipes] = useState<Set<number>>(new Set());
    const [selectAll, setSelectAll] = useState(false);
    const [editingRecipe, setEditingRecipe] = useState<Recipe | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [isSearchActive, setIsSearchActive] = useState(false);
    const [includeSubrecipes, setIncludeSubrecipes] = useState(false);
    const [categoryFilter, setCategoryFilter] = useState('');
    const [apiError, setApiError] = useState<string | null>(null);
    const [exportPreviewHtml, setExportPreviewHtml] = useState<string | null>(null);

    const sourceModal = useDisclosure();
    const temperatureModal = useDisclosure();
    const conversionsModal = useDisclosure();
    const recipeModal = useDisclosure();
    const searchPanel = useDisclosure();

    const searchInputRef = useRef<HTMLInputElement>(null);
    const categoryFilterRef = useRef('');

    useEffect(() => {
        categoryFilterRef.current = categoryFilter;
    }, [categoryFilter]);

    const fetchRecipes = useCallback((selectedCategory: string) => {
        api.fetchRecipes(includeSubrecipes)
            .then(data => {
                setAllRecipes(data);
                setRecipes(filterByCategory(data, selectedCategory));
            })
            .catch(error => {
                console.error('Error fetching recipes:', error);
                setApiError('Failed to fetch recipes');
            });
    }, [includeSubrecipes]);

    useEffect(() => {
        fetchRecipes(categoryFilterRef.current);
    }, [fetchRecipes]);

    const clearSelection = () => {
        setSelectedRecipes(new Set());
        setSelectAll(false);
    };

    const recipeImport = useRecipeImport({
        refreshRecipes: () => fetchRecipes(categoryFilter),
        clearSelection,
        setError: setApiError,
    });

    const { sortedRecipes, requestSort, getSortIcon } = useRecipeSort(recipes);

    const selectedRecipeList = recipes.filter(recipe => selectedRecipes.has(recipe.id));
    // null means "all recipes" for the backend export endpoints
    const selectedIdsOrNull = selectedRecipeList.length > 0 ? selectedRecipeList.map(r => r.id) : null;
    const recipesToExport = selectedRecipes.size > 0 ? selectedRecipeList : recipes;

    const uniqueCategories = Array.from(new Set(allRecipes.flatMap(recipe =>
        (recipe.categories ?? '').split(',').map(cat => cat.trim()))))
        .filter(category => category !== '')
        .sort((a, b) => a.toLowerCase().localeCompare(b.toLowerCase()));

    const deleteRecipe = (id: number) => {
        if (!window.confirm('Are you sure you want to delete this recipe?')) return;
        api.deleteRecipe(id)
            .then(() => {
                setRecipes(recipes.filter(recipe => recipe.id !== id));
                setApiError(null);
            })
            .catch(error => {
                console.error('Error deleting recipe:', error);
                setApiError('Failed to delete recipe');
            });
    };

    const handleDeleteMany = () => {
        const ids = selectedRecipeList.map(recipe => recipe.id);
        if (ids.length === 0) {
            alert('No recipes selected for deletion.');
            return;
        }
        if (!window.confirm(`Are you sure you want to delete ${ids.length} recipe(s)?`)) return;
        api.deleteRecipes(ids)
            .then(() => {
                setRecipes(recipes.filter(recipe => !ids.includes(recipe.id)));
                clearSelection();
                setApiError(null);
            })
            .catch(error => {
                console.error('Error deleting recipes:', error);
                setApiError('Failed to delete recipes');
            });
    };

    const editRecipe = (recipe: Recipe) => {
        setEditingRecipe(recipe);
        recipeModal.open();
    };

    const handleAddRecipe = () => {
        setEditingRecipe(null);
        recipeModal.open();
    };

    const handleRecipeSaved = () => {
        setEditingRecipe(null);
        recipeModal.close();
        fetchRecipes(categoryFilter);
    };

    // Sources, temperatures and conversions affect recipes, so reload the whole app when they close.
    const closeAndReload = (modal: { close: () => void }) => () => {
        modal.close();
        window.location.reload();
    };

    const handleOpenSearchPanel = () => {
        searchPanel.open();
        setTimeout(() => searchInputRef.current?.focus(), 0);
    };

    const handleSearch = () => {
        api.searchRecipes(searchQuery)
            .then(data => {
                setRecipes(data);
                setIsSearchActive(true);
                searchPanel.close();
                setApiError(null);
            })
            .catch(error => {
                console.error('Error searching recipes:', error);
                setApiError('Failed to search for recipes');
            });
    };

    const handleShowAllRecipes = () => {
        setRecipes(allRecipes);
        setIsSearchActive(false);
    };

    const handleExportCsv = async () => {
        try {
            const csvContent = await api.exportRecipesAsText(selectedIdsOrNull);
            const newWindow = window.open('', '_blank');
            if (newWindow) {
                newWindow.document.write(`<pre>${csvContent}</pre>`);
                newWindow.document.close();
            }
        } catch (error) {
            console.error('Error exporting recipes:', error);
            setApiError('Failed to export recipes. Please try again.');
        }
    };

    const handleShoppingList = async () => {
        const guests = promptGuests();
        if (!guests) return;
        try {
            const items = await api.fetchShoppingList(selectedIdsOrNull, guests);
            openInNewWindow(buildShoppingListHtml(items, guests));
        } catch (error) {
            console.error('Error exporting shopping list:', error);
            setApiError('Failed to export shopping list. Please try again.');
        }
    };

    const handleExportView = (singleRecipe?: Recipe) => {
        const guests = promptGuests();
        if (!guests) {
            alert('Please enter a valid number of guests.');
            return;
        }
        const html = buildRecipesHtml(
            singleRecipe ? [singleRecipe] : recipesToExport,
            guests,
            singleRecipe ? singleRecipe.name : 'All Recipes',
        );
        openInNewWindow(html);
        if (!singleRecipe) setExportPreviewHtml(html);
    };

    const handleExportWord = async () => {
        const guests = promptGuests();
        if (!guests) {
            alert('Please enter a valid number of guests.');
            return;
        }
        await exportToWord(recipesToExport, guests, 'recipes.docx');
    };

    const handleCreateBook = async () => {
        try {
            const { recipes: bookRecipes, ...appendices } = await api.fetchBookData();
            await exportToWord(bookRecipes, 4, 'recipe-book.docx', appendices);
        } catch (error) {
            console.error('Error creating recipe book:', error);
            setApiError('Failed to create book export. Please try again.');
        }
    };

    const handleConfirmExport = () => {
        if (exportPreviewHtml) downloadHtml(exportPreviewHtml, 'recipes.html');
        setExportPreviewHtml(null);
    };

    const handleCheckboxChange = (recipeId: number) => {
        setSelectedRecipes(prev => {
            const next = new Set(prev);
            if (!next.delete(recipeId)) next.add(recipeId);
            return next;
        });
    };

    const handleSelectAllChange = () => {
        setSelectedRecipes(selectAll ? new Set() : new Set(recipes.map(recipe => recipe.id)));
        setSelectAll(!selectAll);
    };

    const handleCategoryFilterChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
        setCategoryFilter(event.target.value);
        setRecipes(filterByCategory(allRecipes, event.target.value));
    };

    return (
        <div>
            <Suspense fallback={null}>
                {sourceModal.isOpen && <SourceModal onClose={closeAndReload(sourceModal)}/>}
                {temperatureModal.isOpen && <TemperaturesModal onClose={closeAndReload(temperatureModal)}/>}
                {conversionsModal.isOpen && <ConversionsModal onClose={closeAndReload(conversionsModal)}/>}
                {recipeModal.isOpen && (
                    <RecipeModal
                        recipe={editingRecipe}
                        onCancel={recipeModal.close}
                        onRecipeSaved={handleRecipeSaved}
                    />
                )}
            </Suspense>
            <div className="standard-form">
                <button onClick={sourceModal.open}>
                    <i className="fas fa-book"></i>
                    Sources
                </button>
                <button onClick={conversionsModal.open}>
                    <i className="fas fa-exchange-alt"></i>
                    Conversions
                </button>
                <button onClick={temperatureModal.open}>
                    <i className="fas fa-thermometer-half"></i>
                    Temperatures
                </button>
                <label htmlFor="csvFileInput" style={{display: 'flex', alignItems: 'center', gap: '0.5rem', paddingLeft: '0.5rem'}}>
                    <i className="fas fa-file-import"></i>
                    Import recipes:
                </label>
                <input id="csvFileInput" type="file" accept=".csv,.txt,.xlsx,.xslx,.xls"
                       onChange={(e) => recipeImport.setFile(e.target.files?.[0] ?? null)}/>
                {recipeImport.file && <button onClick={recipeImport.requestImport}>
                    <i className="fas fa-upload"></i>
                    Import
                </button>}
                <button onClick={handleOpenSearchPanel} title="Find by content">
                    <i className="fas fa-search"></i>
                    Search
                </button>
                {isSearchActive && <button onClick={handleShowAllRecipes}>
                    <i className="fas fa-list"></i>
                    Show All
                </button>}
                {searchPanel.isOpen &&
                    <input
                        ref={searchInputRef}
                        type="text"
                        placeholder="Enter regex..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        onKeyDown={(e) => { if (e.key === 'Enter') handleSearch(); }}
                        style={{flexGrow: 1, minWidth: '200px'}}
                    />}
                {searchPanel.isOpen && <button onClick={handleSearch}>
                    <i className="fas fa-search"></i>
                    Search
                </button>}
                {searchPanel.isOpen && <button onClick={searchPanel.close}>
                    <i className="fas fa-times"></i>
                    Cancel
                </button>}
                <label htmlFor="categoryFilter" style={{display: 'flex', alignItems: 'center', gap: '0.5rem'}}>
                    <i className="fas fa-filter"></i>
                    Category:
                </label>
                <select id="categoryFilter" value={categoryFilter} onChange={handleCategoryFilterChange}>
                    <option value="">All Categories</option>
                    {uniqueCategories.map(category => (
                        <option key={category} value={category}>{category}</option>
                    ))}
                </select>
                <label>
                    <input
                        type="checkbox"
                        checked={includeSubrecipes}
                        onChange={(e) => setIncludeSubrecipes(e.target.checked)}
                    />
                    Include subrecipes
                </label>
            </div>
            <div>
                {apiError && <p className="error">{apiError}</p>}
                {recipeImport.warnings.map((warning, index) => <p className="warning" key={`${warning}-${index}`}>{warning}</p>)}
            </div>
            <div style={{padding: '0.5rem 0', color: 'var(--text-secondary)', fontSize: '0.875rem'}}>
                <button onClick={handleAddRecipe} title="Add recipe">
                    <i className="fas fa-plus"></i>
                </button>
                <button onClick={() => handleExportView()} title="Print layout">
                    <i className="fas fa-print"></i>
                </button>
                <button onClick={handleExportCsv} title="Export to CSV">
                    <i className="fas fa-file-export"></i>
                </button>
                <button onClick={handleShoppingList} title="Export shopping list">
                    <i className="fas fa-shopping-cart"></i>
                </button>
                <button onClick={handleExportWord} title="Export to Word">
                    <i className="fas fa-file-word"></i>
                </button>
                <button onClick={handleCreateBook} title="Create full recipe book">
                    <i className="fas fa-book-open"></i>
                </button>
                <button onClick={handleDeleteMany} title="Delete selected recipes" className="btn-danger">
                    <i className="fas fa-trash"></i>
                </button>
                &nbsp;
                Showing {sortedRecipes.length} recipe{sortedRecipes.length !== 1 ? 's' : ''}
                {categoryFilter && ` in category "${categoryFilter}"`}
                {isSearchActive && ` matching search`}
            </div>
            <RecipeTable
                recipes={sortedRecipes}
                selectedIds={selectedRecipes}
                allSelected={selectAll}
                getSortIcon={getSortIcon}
                onSort={requestSort}
                onToggleAll={handleSelectAllChange}
                onToggle={handleCheckboxChange}
                onEdit={editRecipe}
                onView={handleExportView}
                onDelete={deleteRecipe}
            />
            {exportPreviewHtml !== null && (
                <PromptDialog
                    message="Do you want to export the recipes to a file?"
                    onConfirm={handleConfirmExport}
                    onCancel={() => setExportPreviewHtml(null)}
                />
            )}
            {recipeImport.isPromptOpen && (
                <PromptDialog
                    message={"Delete all existing recipes before import?\n\nYes = delete first.\nNo = keep existing and import on top."}
                    onConfirm={recipeImport.importAfterDeleting}
                    onCancel={recipeImport.importKeepingExisting}
                />
            )}
        </div>
    );
}

export default RecipeList;
