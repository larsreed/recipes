import { useState, useEffect } from 'react';
import axios from 'axios';
import RecipeForm from './RecipeForm.tsx';

interface Ingredient {
    id: number;
    amount?: number;
    name: string;
    instruction?: string;
    measure?: string;
}

interface Attachment {
    id: number;
    fileName: string;
    fileType: string;
    data: string; // Base64 encoded
}

interface Recipe {
    id: number;
    name: string;
    ingredients: Ingredient[];
    instructions: string;
    people: number;
    served?: string;
    attachments: Attachment[];
    source?: Source;
    pageRef?: string;
    rating?: number; // New field
    notes?: string; // New field
}

interface Source {
    id: number;
    name: string;
    authors: string;
    attachments: Attachment[];
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
            <ul>
                {recipes.map(recipe => (
                    <li key={recipe.id}>
                        <h3>{recipe.id}. {recipe.name}</h3>
                        <p>Ingredients:</p>
                        <ul>
                            {recipe.ingredients.map(ingredient => (
                                <li key={ingredient.id}>
                                    {ingredient.amount && `${ingredient.amount} `}
                                    {ingredient.measure && `${ingredient.measure} `}
                                    {ingredient.name}
                                    {ingredient.instruction && ` (${ingredient.instruction})`}
                                </li>
                            ))}
                        </ul>
                        <p>Instructions: {recipe.instructions}</p>
                        <p>People: {recipe.people}</p>
                        {recipe.served && <p>Served: {recipe.served}</p>}
                        {recipe.rating && <p>Rating: {recipe.rating} stars</p>} {/* New field */}
                        {recipe.notes && <p>Notes: {recipe.notes}</p>} {/* New field */}
                        <p>Attachments:</p>
                        <ul>
                            {recipe.attachments.map(attachment => (
                                <li key={attachment.id}>
                                    <a href={attachment.data} download={attachment.fileName}>{attachment.fileName}</a>
                                </li>
                            ))}
                        </ul>
                        {recipe.source && (
                            <div>
                                <p>Source: {recipe.source.name} by {recipe.source.authors}{recipe.pageRef && <span> p. {recipe.pageRef}</span>}</p>
                                <p>Source Attachments:</p>
                                <ul>
                                    {recipe.source.attachments.map(attachment => (
                                        <li key={attachment.id}>
                                            <a href={attachment.data} download={attachment.fileName}>{attachment.fileName}</a>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}
                    </li>
                ))}
            </ul>
            <hr/>
            <RecipeForm onRecipeCreated={fetchRecipes}/>
        </div>
    );
}

export default RecipeList;
