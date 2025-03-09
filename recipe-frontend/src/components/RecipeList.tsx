import { useState, useEffect } from 'react';
import axios from 'axios';
import RecipeForm from './RecipeForm.tsx';

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
                    </tr>
                ))}
                </tbody>
            </table>
            <hr/>
            <RecipeForm onRecipeCreated={fetchRecipes}/>
        </div>
    );
}

export default RecipeList;
