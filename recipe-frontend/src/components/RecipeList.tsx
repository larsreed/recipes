import React, {useState, useEffect} from 'react';
import Modal from 'react-modal';
import axios from 'axios';
import SourceModal from "./SourceModal.tsx";
import RecipeModal from "./RecipeModal.tsx";
import PromptDialog from "./PromptDialog.tsx";
import config from '../config';


interface Attachment {
    id: number;
    fileName: string;
    fileContent: string;
}

interface Recipe {
    id: number;
    name: string;
    subrecipe: boolean;
    served?: string;
    source?: Source;
    pageRef?: string;
    rating?: number;
    people: number;
    wineTips?: string;
    matchFor?: string;
    ingredients: Ingredient[];
    attachments: Attachment[];
    instructions: string;
    subrecipes?: Recipe[];
}

interface Source {
    id: number;
    name: string;
    authors: string;
}

interface Ingredient {
    id: number;
    prefix: string;
    amount: number;
    measure: string;
    name: string;
    instruction: string;
}

Modal.setAppElement('#root');

function RecipeList() {
    const [recipes, setRecipes] = useState<Recipe[]>([]);
    const [selectedRecipes, setSelectedRecipes] = useState<Set<number>>(new Set());
    const [selectAll, setSelectAll] = useState(false);
    const [editingRecipe, setEditingRecipe] = useState<Recipe | null>(null);
    const [isSourceModalOpen, setIsSourceModalOpen] = useState(false);
    const [isRecipeModalOpen, setIsRecipeModalOpen] = useState(false);
    const [isSearchPanelOpen, setIsSearchPanelOpen] = useState(false);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [htmlContent, setHtmlContent] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [isSearchActive, setIsSearchActive] = useState(false);
    const [isExportAll, setIsExportAll] = useState(false);
    const [includeSubrecipes, setIncludeSubrecipes] = useState(false);
    const [sortConfig, setSortConfig] = useState({ key: 'id', direction: 'ascending' });
    const [csvFile, setCsvFile] = useState<File | null>(null);
    const [apiError, setApiError] = useState<string | null>(null);

    const fetchRecipes = () => {
        axios.get(`${config.backendUrl}/api/recipes?includeSubrecipes=${includeSubrecipes}`)
            .then(response => {
                setRecipes(response.data);
            })
            .catch(error => {
                console.error('Error fetching recipes:', error)
                setApiError('Failed to fetch recipes');
            });
    };

    useEffect(() => {
        fetchRecipes();
    }, [includeSubrecipes]);

    const sortedRecipes = [...recipes].sort((a, b) => {
        if (a[sortConfig.key] < b[sortConfig.key]) {
            return sortConfig.direction === 'ascending' ? -1 : 1;
        }
        if (a[sortConfig.key] > b[sortConfig.key]) {
            return sortConfig.direction === 'ascending' ? 1 : -1;
        }
        return 0;
    });

    const requestSort = (key) => {
        let direction = 'ascending';
        if (sortConfig.key === key && sortConfig.direction === 'ascending') {
            direction = 'descending';
        }
        setSortConfig({ key, direction });
    };

    const getSortIcon = (key) => {
        if (sortConfig.key === key) {
            return sortConfig.direction === 'ascending' ? 'fas fa-sort-up' : 'fas fa-sort-down';
        }
        return 'fas fa-sort';
    };


    const deleteRecipe = (id: number) => {
        if (window.confirm('Are you sure you want to delete this recipe?')) {
            axios.delete(`${config.backendUrl}/api/recipes/${id}`)
                .then(() => {
                    setRecipes(recipes.filter(recipe => recipe.id !== id));
                    setApiError(null);
                })
                .catch(error => {
                    console.error('Error deleting recipe:', error)
                    setApiError('Failed to delete recipe');
                });
        }
    };

    const editRecipe = (recipe: Recipe) => {
        setEditingRecipe(recipe);
        setIsRecipeModalOpen(true);
    };

    const handleRecipeSaved = () => {
        setEditingRecipe(null);
        setIsRecipeModalOpen(false);
        fetchRecipes();
    };

    const handleOpenSourceModal = () => {
        setIsSourceModalOpen(true);
    };

    const handleCloseSourceModal = () => {
        setIsSourceModalOpen(false);
        window.location.reload(); // Refresh the entire application
    };

    const handleOpenRecipeModal = () => {
        setEditingRecipe(null);
        setIsRecipeModalOpen(true);
    };

    const handleCloseRecipeModal = () => {
        setIsRecipeModalOpen(false);
    };

    const handleOpenSearchPanel = () => {
        setIsSearchPanelOpen(true);
    };

    const handleCloseSearchPanel = () => {
        setIsSearchPanelOpen(false);
    };

    const handleSearch = () => {
        const searchUrl = `${config.backendUrl}/api/recipes/search?query=${encodeURIComponent(searchQuery)}`
        // console.log(searchUrl);
        axios.get(searchUrl)
            .then(response => {
                setRecipes(response.data);
                setIsSearchActive(true);
                setIsSearchPanelOpen(false);
                setApiError(null);
            })
            .catch(error => {
                console.error('Error searching recipes:', error)
                setApiError('Failed to search for recipes');
            });
    };

    const handleShowAllRecipes = () => {
        fetchRecipes();
        setIsSearchActive(false);
    };

    const handleImport = async (event: React.FormEvent) => {
        event.preventDefault();
        if (!csvFile) {
            alert('Please select a CSV file to import.');
            return;
        }
        const formData = new FormData();
        formData.append('file', csvFile);
        try {
            const response = await axios.post(`${config.backendUrl}/api/recipes/import`, formData, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            });
            console.log("Recipes imported:", response.data);
            fetchRecipes();
            setCsvFile(null);
            setApiError(null);
            const fileInput = document.getElementById('csvFileInput') as HTMLInputElement;
            if (fileInput) fileInput.value = ''; // Clear the file input
        } catch (error) {
            console.error('Error importing recipes:', error);
            setApiError('Failed to import recipes. Please check the CSV file format and try again.\'');
            fetchRecipes();
        }
    };

    const exportHtmlContent = (htmlContent: string, fileName: string) => {
        const blob = new Blob([htmlContent], {type: 'text/html'});
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    const handleExportCsv = () => {
        const recipesToExport = selectedRecipes.size === 0 ? [] : recipes
            .filter(recipe => selectedRecipes.has(recipe.id))
            .map(recipe => recipe.id); // Only include IDs

        try {
            axios.post(`${config.backendUrl}/api/recipes/export-all`,
                recipesToExport.length > 0 ? recipesToExport : null, // Send null for an empty body
                {
                    headers: {
                        'Content-Type': 'application/json',
                    },
                }
            ).then(response => {
                const csvContent = response.data; // Assuming the backend returns CSV content as plain text
                const newWindow = window.open("", "_blank");
                if (newWindow) {
                    newWindow.document.write(`<pre>${csvContent}</pre>`);
                    newWindow.document.close();
                }
            }).catch(error => {
                console.error("Error exporting recipes:", error);
                setApiError('Failed to export recipes. Please try again.');
            });
        } catch (error) {
            console.error("Error exporting recipes:", error);
            setApiError('Failed to export recipes. Please try again.');
        }
    };

    const handleShoppingList = () => {
        const recipesToShop = selectedRecipes.size === 0 ? [] : recipes
            .filter(recipe => selectedRecipes.has(recipe.id))
            .map(recipe => recipe.id); // Only include IDs

        const guests = prompt("Guests", "4");
        if (guests && parseInt(guests) > 0) {

            try {
                axios.post(`${config.backendUrl}/api/recipes/shopping-list`, {
                    recipeIds: recipesToShop.length > 0 ? recipesToShop : null,
                    guests: parseInt(guests),
                }, {
                    headers: {
                        'Content-Type': 'application/json',
                    },
                }).then(response => {
                    const shoppingContent = response.data; // Assuming the backend returns CSV content as plain text
                    const newWindow = window.open("", "_blank");
                    if (newWindow) {
                        const htmlContent = `
                        <html>
                        <head>
                            <title>Shopping List</title>
                            <style>
                                body { font-family: Arial, sans-serif; margin: 20px; }
                                table { border-collapse: collapse; }
                                th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
                                th { background-color: #f4f4f4; }
                            </style>
                        </head>
                        <body>
                            <h1>Shopping List</h1>
                            <p>for ${guests} guests</p>
                            <table>
                                <thead>
                                    <tr>
                                        <th>Item</th>
                                        <th>Amount</th>
                                        <th>Measure</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    ${shoppingContent.map(item => `
                                        <tr>
                                            <td>${item.name}</td>
                                            <td>${item.amount? item.amount.toFixed(2) : ''} 
                                            <td>${item.measure || ''}</td>
                                        </tr>
                                    `).join('')}
                                </tbody>
                            </table>
                        </body>
                        </html>
                    `;
                        newWindow.document.write(htmlContent);
                        newWindow.document.close();
                    }
                }).catch(error => {
                    console.error("Error exporting shopping list:", error);
                    setApiError('Failed to export shopping list. Please try again.');
                });
            } catch (error) {
                console.error("Error exporting shopping list:", error);
                setApiError('Failed to export shopping list. Please try again.');
            }
        }
    };

    const handleExportView = (singleRecipe?: Recipe) => {
        const guests = prompt("Guests", "4");
        if (guests && parseInt(guests) > 0) {
            const guestsNumber = parseInt(guests);
            const recipesToExport = singleRecipe ? [singleRecipe] : (selectedRecipes.size > 0 ? recipes.filter(recipe => selectedRecipes.has(recipe.id)) : recipes);

            const generateRecipeHtml: (recipe: Recipe) => string = (recipe: Recipe) => `
            <div class="recipe" style="${recipe.subrecipe ? '' : 'page-break-after: always;'}">
                ${recipe.subrecipe ? `<h3>» ${recipe.name}</h3>` : `<h2>${recipe.name}</h2>`}
                <div class="attachments">
                    ${recipe.attachments.map(attachment => `
                        <div class="attachment">
                            ${attachment.fileName.match(/\.(jpeg|jpg|gif|png|webp)$/) ?
                                `<img src="data:image/jpeg;base64,${attachment.fileContent}" alt="${attachment.fileName}" />` :
                                `<p>Attachment: ${attachment.fileName}</p>`
                            }
                        </div>
                    `).join('')}
                </div>
                ${recipe.served ? `<p>Served: ${recipe.served.replace(/\n/g, '<br />')}</p>` : ''}
                ${recipe.source ? `<p>Source: ${recipe.source.name}${recipe.pageRef ? ` p.${recipe.pageRef}` : ''}</p>` : ''}
                ${recipe.rating ? `<p>Rating: ${recipe.rating}</p>` : ''}
                ${recipe.wineTips ? `<p>Wine tips: ${recipe.wineTips.replace(/\n/g, '<br />')}</p>` : ''}
                ${recipe.matchFor ? `<p>Match for: ${recipe.matchFor.replace(/\n/g, '<br />')}</p>` : ''}
                ${recipe.subrecipe ? `<h4>Ingredients</h4>` : `<h3>Ingredients</h3>`}
                <table class="noborder">
                    ${recipe.ingredients.map(ingredient => `
                        <tr class="ingredient">
                            <td class="ingredient-cell">
                                ${ingredient.prefix ? ingredient.prefix.replace(/\n/g, '<br />') : ''}
                            </td>
                            <td class="ingredient-cell">
                                ${ingredient.amount ? ((ingredient.amount * guestsNumber) / recipe.people).toFixed(2) : ''} 
                                ${ingredient.measure || ''} 
                            </td>
                            <td class="ingredient-cell ingredient-name">
                                ${ingredient.name}
                            </td>
                            <td class="ingredient-cell">
                                ${ingredient.instruction ? ingredient.instruction.replace(/\n/g, '<br />') : ''}
                            </td>
                        </tr>
                    `).join('')}
                </table>
                ${recipe.subrecipe ? `<h4>Instructions</h4>` : `<h3>Instructions</h3>`}
                <p class="instructions">${recipe.instructions.replace(/\n/g, '<br />')}</p>
                ${recipe.subrecipes ? recipe.subrecipes.map(subrecipe => generateRecipeHtml(subrecipe)).join('') : ''}
            </div>
        `;

            const htmlContent = `
            <html lang="en">
            <head>
                <title>${singleRecipe ? singleRecipe.name : "All Recipes"}</title>
                <style>
                    @page {
                        size: A4;
                        margin: 0;
                    }
                    body {
                        font-family: Calibri, sans-serif;
                        background-color: #FFFFFF;
                        background-image: none;
                        color: #000000;
                        margin: 0;
                        overflow: auto;
                        position: relative;
                        box-sizing: border-box;
                        width: 210mm;
                        height: 296mm;
                    }
                    .noborder {
                        border:none;
                        border-collapse: collapse;
                    }
                    .recipe {
                        max-width: 800px;
                        margin: 20px auto;
                        padding: 20px;
                        background: #fff;
                        border: 1px solid #ddd;
                        border-radius: 8px;
                        box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
                    }
                    .recipe h2 {
                        margin-top: 0;
                        color: #2c3e50;
                    }
                    .recipe p {
                        margin: 5px 0;
                    }
                    .recipe h3 {
                        margin-bottom: 10px;
                        color: #16a085;
                    }
                    .recipe ul {
                        list-style-type: none;
                        padding: 0;
                    }
                    .recipe ul li {
                        margin-bottom: 5px;
                    }
                    .ingredient {
                        margin-bottom: 20px;
                        border-bottom: 1px dotted #16a085;
                    }
                    .ingredient-cell {
                        vertical-align: top;
                        padding: 0 8px;
                    }
                    .ingredient-name {
                        color: chocolate;
                    }
                    .instructions {
                        margin-top: 60px;
                    }
                    .attachment {
                        margin-top: 20px;
                    }
                    .attachment img {
                        max-width: 100%;
                        height: auto;
                    }
                </style>
            </head>
            <body>
                ${recipesToExport.map(recipe => generateRecipeHtml(recipe)).join('')}
            </body>
            </html>
        `;

            const newWindow = window.open("", "_blank");
            if (newWindow) {
                newWindow.document.write(htmlContent);
                newWindow.document.close();
            }

            if (!singleRecipe) {
                setIsExportAll(true);
                setIsDialogOpen(true);
                setHtmlContent(htmlContent);
            }
        } else {
            alert("Please enter a valid number of guests.");
        }
    };

    const handleConfirmExport = () => {
        setIsDialogOpen(false);
        if (isExportAll) {
            exportHtmlContent(htmlContent, 'recipes.html');
        }
        setHtmlContent('');
    };

    const handleCancelExport = () => {
        setIsDialogOpen(false);
        setHtmlContent('');
    };

    const handleViewRecipe = (recipe: Recipe) => {
        handleExportView(recipe);
    };

    const handleCheckboxChange = (recipeId: number) => {
        setSelectedRecipes(prevSelectedRecipes => {
            const newSelectedRecipes = new Set(prevSelectedRecipes);
            if (newSelectedRecipes.has(recipeId)) {
                newSelectedRecipes.delete(recipeId);
            } else {
                newSelectedRecipes.add(recipeId);
            }
            return newSelectedRecipes;
        });
    };

    const handleSelectAllChange = () => {
        if (selectAll) {
            setSelectedRecipes(new Set());
        } else {
            setSelectedRecipes(new Set(recipes.map(recipe => recipe.id)));
        }
        setSelectAll(!selectAll);
    };

    return (
        <div>
            <div className="standard-form">
                <button onClick={handleOpenSourceModal}>Edit sources</button>
            </div>
            <div className="standard-form">
                Import recipes: <input id="csvFileInput" type="file" accept=".csv,.txt"
                                       onChange={(e) => setCsvFile(e.target.files[0])}/>
                &nbsp;
                {csvFile && <button onClick={handleImport}>Import</button>}
            </div>
            <div className="standard-form">
                <button onClick={handleOpenSearchPanel} title="Find by content">
                    <i className="fas fa-search"></i>
                </button>
                &nbsp;
                {isSearchActive && <button onClick={handleShowAllRecipes}>All</button>}
                {isSourceModalOpen && <SourceModal onClose={handleCloseSourceModal}/>}
                {isRecipeModalOpen && (
                    <RecipeModal
                        recipe={editingRecipe}
                        onCancel={handleCloseRecipeModal}
                        onRecipeSaved={handleRecipeSaved}
                    />
                )}
                {isSearchPanelOpen &&
                    <input
                        type="text"
                        placeholder="Enter regex..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />}
                &nbsp;
                {isSearchPanelOpen && <button onClick={handleSearch}>Search</button>}
                &nbsp;
                {isSearchPanelOpen && <button onClick={handleCloseSearchPanel}>Cancel</button>}
                &nbsp;
                <label>
                    <input
                        type="checkbox"
                        checked={includeSubrecipes}
                        onChange={(e) => setIncludeSubrecipes(e.target.checked)}
                    />
                    Include subrecipes
                </label>
                <p/>
            </div>
            <div>
                {apiError && <p className="error">{apiError}</p>}
            </div>
            <table className="recipe-list-table">
                <thead>
                <tr>
                    <th>
                        <input
                            type="checkbox"
                            checked={selectAll}
                            onChange={handleSelectAllChange}
                        />
                    </th>
                    <th onClick={() => requestSort('id')}>
                        ID <i className={getSortIcon('id')}></i>
                    </th>
                    <th onClick={() => requestSort('name')}>
                        Name <i className={getSortIcon('name')}></i>
                    </th>
                    <th onClick={() => requestSort('served')}>
                        Served <i className={getSortIcon('served')}></i>
                    </th>
                    <th onClick={() => requestSort('source')}>
                        Source <i className={getSortIcon('source')}></i>
                    </th>
                    <th onClick={() => requestSort('pageRef')}>
                        Page Ref <i className={getSortIcon('pageRef')}></i>
                    </th>
                    <th onClick={() => requestSort('rating')}>
                        Rating <i className={getSortIcon('rating')}></i>
                    </th>
                    <th>
                        <button onClick={handleOpenRecipeModal} title="Add recipe">
                            <i className="fas fa-plus"></i>
                        </button>
                        &nbsp;
                        <button onClick={() => handleExportView()} title="Print layout">
                            <i className="fas fa-print"></i>
                        </button>
                        &nbsp;
                        <button onClick={() => handleExportCsv()} title="Export to CSV">
                            <i className="fas fa-file-export"></i>
                        </button>
                        &nbsp;
                        <button onClick={() => handleShoppingList()} title="Export shopping list">
                            <i className="fas fa-list"></i>
                        </button>
                    </th>
                </tr>
                </thead>
                <tbody>
                {sortedRecipes.map(recipe => (
                    <tr key={recipe.id}>
                        <td>
                            <input
                                type="checkbox"
                                checked={selectedRecipes.has(recipe.id)}
                                onChange={() => handleCheckboxChange(recipe.id)}
                            />
                        </td>
                        <td>
                            {recipe.id}
                        </td>
                        <td>{recipe.name}</td>
                        <td>{recipe.served}</td>
                        <td>{recipe.source ? recipe.source.name : ''}</td>
                        <td>{recipe.pageRef}</td>
                        <td className="center">{recipe.rating}</td>
                        <td>
                            <button onClick={() => editRecipe(recipe)}
                                    title="Edit">
                                <i className="fas fa-edit"></i>
                            </button>
                            &nbsp;
                            <button onClick={() => deleteRecipe(recipe.id)} title="Delete">
                                <i className="fas fa-trash"></i>
                            </button>
                            &nbsp;
                            <button onClick={() => handleViewRecipe(recipe)} title="View">
                                <i className="fas fa-print"></i>
                            </button>
                        </td>
                    </tr>
                ))}
                </tbody>
            </table>
            {isDialogOpen && (
                <PromptDialog
                    message="Do you want to export the recipes to a file?"
                    onConfirm={handleConfirmExport}
                    onCancel={handleCancelExport}
                />
            )}
        </div>
    );
}

export default RecipeList;
