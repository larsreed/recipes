import { useState, useEffect } from 'react';
import axios from 'axios';
import SourceModal from "./SourceModal.tsx";
import RecipeModal from "./RecipeModal.tsx";

interface Recipe {
    id: number;
    name: string;
    served?: string;
    source?: Source;
    pageRef?: string;
    rating?: number;
    people: number;
    ingredients: Ingredient[];
    instructions: string;
}

interface Source {
    id: number;
    name: string;
    authors: string;
}

interface Ingredient {
    id: number;
    amount: number;
    measure: string;
    name: string;
    instruction: string;
}

function RecipeList() {
    const [recipes, setRecipes] = useState<Recipe[]>([]);
    const [editingRecipe, setEditingRecipe] = useState<Recipe | null>(null);
    const [isSourceModalOpen, setIsSourceModalOpen] = useState(false);
    const [isRecipeModalOpen, setIsRecipeModalOpen] = useState(false);
    const [isSearchPanelOpen, setIsSearchPanelOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [isSearchActive, setIsSearchActive] = useState(false);

    const fetchRecipes = () => {
        axios.get('http://localhost:8080/api/recipes')
            .then(response => {
                setRecipes(response.data);
            })
            .catch(error => console.error('Error fetching recipes:', error));
    };

    useEffect(() => {
        fetchRecipes();
    }, []);

    const deleteRecipe = (id: number) => {
        if (window.confirm('Are you sure you want to delete this recipe?')) {
            axios.delete(`http://localhost:8080/api/recipes/${id}`)
                .then(() => {
                    setRecipes(recipes.filter(recipe => recipe.id !== id));
                })
                .catch(error => console.error('Error deleting recipe:', error));
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
        axios.get(`http://localhost:8080/api/recipes/search?query=${encodeURIComponent(searchQuery)}`)
            .then(response => {
                setRecipes(response.data);
                setIsSearchActive(true);
                setIsSearchPanelOpen(false);
            })
            .catch(error => console.error('Error searching recipes:', error));
    };

    const handleShowAllRecipes = () => {
        fetchRecipes();
        setIsSearchActive(false);
    };

    const handleViewRecipe = (recipe: Recipe) => {
        const guests = prompt("Guests", "1");
        if (guests && parseInt(guests) > 0) {
            const guestsNumber = parseInt(guests);
            const newWindow = window.open("", "_blank");
            if (newWindow) {
                newWindow.document.write(`
                    <html>
                    <head>
                        <title>Recipe View</title>
                        <style>
                            @page {
                                size: A4;
                                margin: 0
                            }
                            body { font-family: Calibri, sans-serif; 
                                background-color:#FFFFFF; 
                                background-image:none; 
                                color:#000000;
                                margin: 0;
                                overflow: hidden;
                                position: relative;
                                box-sizing: border-box;
                                page-break-after: always;
                                width: 210mm; 
                                height: 296mm;
                             }
                            .recipe { max-width: 600px; margin: auto; }
                            .ingredient { margin-bottom: 10px; }
                            .instructions { margin-top: 20px; }
                        </style>
                    </head>
                    <body>
                        <div class="recipe">
                            <h2>${recipe.name}</h2>
                            ${recipe.served ? `<p>Served: ${recipe.served}</p>` : ''}
                            ${recipe.source ? `<p>Source: ${recipe.source.name}${recipe.pageRef ? ` p.${recipe.pageRef}` : ''}</p>` : ''}
                            ${recipe.rating ? `<p>Rating: ${recipe.rating}</p>` : ''}
                            <h3>Ingredients</h3>
                            <ul>
                                ${recipe.ingredients.map(ingredient => `
                                    <li class="ingredient">
                                        ${((ingredient.amount * guestsNumber) / recipe.people).toFixed(2)} ${ingredient.measure} ${ingredient.name} ${ingredient.instruction || ""}
                                    </li>
                                `).join('')}
                            </ul>
                            <h3>Instructions</h3>
                            <p class="instructions">${recipe.instructions}</p>
                        </div>
                    </body>
                    </html>
                `);
                newWindow.document.close();
            }
        } else {
            alert("Please enter a valid number of guests.");
        }
    };

    return (
        <div>
            <h2>Recipe List</h2>
            <div>
                <button onClick={handleOpenSourceModal}>Edit sources</button>
                &nbsp;
                <button onClick={handleOpenRecipeModal}>Add recipe</button>
                &nbsp;
                <button onClick={handleOpenSearchPanel}>Find</button>
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
            </div>
            {isSearchPanelOpen && (
                <div>
                    <input
                        type="text"
                        placeholder="Enter regex..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                    <button onClick={handleSearch}>Search</button>
                    &nbsp;
                    <button onClick={handleCloseSearchPanel}>Cancel</button>
                </div>
            )}
            <table>
                <thead>
                <tr>
                    <th>ID</th>
                    <th>Name</th>
                    <th>Served</th>
                    <th>Source</th>
                    <th>Page Reference</th>
                    <th>Rating</th>
                    <th/>
                </tr>
                </thead>
                <tbody>
                {recipes.map(recipe => (
                    <tr key={recipe.id}>
                        <td>{recipe.id}</td>
                        <td>{recipe.name}</td>
                        <td>{recipe.served}</td>
                        <td>{recipe.source ? recipe.source.name : ''}</td>
                        <td>{recipe.pageRef}</td>
                        <td>{recipe.rating}</td>
                        <td>
                            <button onClick={() => editRecipe(recipe)}>EDIT</button>
                            &nbsp;
                            <button onClick={() => deleteRecipe(recipe.id)}>DELETE</button>
                            &nbsp;
                            <button onClick={() => handleViewRecipe(recipe)}>VIEW</button>
                        </td>
                    </tr>
                ))}
                </tbody>
            </table>
        </div>
    );
}

export default RecipeList;
