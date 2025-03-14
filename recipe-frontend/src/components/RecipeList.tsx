import { useState, useEffect } from 'react';
import axios from 'axios';
import RecipeForm from './RecipeForm';

interface Recipe {
    id: number;
    name: string;
    served?: string;
    source?: Source;
    pageRef?: string;
    rating?: number;
}

interface Source {
    id: number;
    name: string;
    authors: string;
}

function RecipeList() {
    const [recipes, setRecipes] = useState<Recipe[]>([]);
    const [editingRecipe, setEditingRecipe] = useState<Recipe | null>(null);

    const fetchRecipes = () => {
        axios.get('http://localhost:8080/api/recipes')
            .then(response => {
                console.log('Fetched recipes:', response.data);
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
    };

    const handleRecipeSaved = () => {
        setEditingRecipe(null);
        fetchRecipes();
    };

    return (
        <div>
            <h2>Recipe List</h2>
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
                            <button onClick={() => deleteRecipe(recipe.id)}>DELETE</button>
                        </td>
                    </tr>
                ))}
                </tbody>
            </table>
            <hr/>
            <RecipeForm
                recipe={editingRecipe}
                onCancel={() => setEditingRecipe(null)}
                onRecipeSaved={handleRecipeSaved}
            />
        </div>
    );
}

export default RecipeList;
