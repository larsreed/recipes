import React, { useState, useEffect } from 'react';
import axios from 'axios';

interface RecipeFormProps {
    recipe?: Recipe;
    onCancel: () => void;
    onRecipeSaved: () => void;
}

interface Recipe {
    id: number;
    name: string;
    subrecipe: boolean;
    people: number;
    instructions: string;
    served?: string;
    sourceId?: number;
    pageRef?: string;
    rating?: number;
    notes?: string;
    ingredients: Ingredient[];
    source?: Source;
    attachments: Attachment[];
}

interface Attachment {
    id: number;
    fileName: string;
    fileContent: string;
}

interface Source {
    id: number;
    name: string;
}

interface Ingredient {
    amount?: number;
    name: string;
    instruction?: string;
    measure?: string;
}

const measureOptions = [
    '', 'ts', 'tsp', 'tbsp', 'ss', 'ml', 'cl', 'dl', 'l', 'mg', 'g', 'kg', 'stk', 'pcs', 'kopper', 'cups'
];

function RecipeForm({ recipe, onCancel, onRecipeSaved }: RecipeFormProps) {
    const [name, setName] = useState(recipe?.name || '');
    const [subrecipe, setSubrecipe] = useState(recipe?.subrecipe || false);
    const [instructions, setInstructions] = useState(recipe?.instructions || '');
    const [people, setPeople] = useState(recipe?.people || 0);
    const [served, setServed] = useState(recipe?.served || '');
    const [sourceId, setSourceId] = useState<number | null>(recipe?.source?.id || null);
    const [sources, setSources] = useState<Source[]>([]);
    const [pageRef, setPageRef] = useState(recipe?.pageRef || '');
    const [rating, setRating] = useState<number | null>(recipe?.rating || null);
    const [notes, setNotes] = useState(recipe?.notes || '');
    const [ingredients, setIngredients] = useState<Ingredient[]>(recipe?.ingredients || [{ name: '' }]);
    const [attachments, setAttachments] = useState<Attachment[]>(recipe?.attachments || []);

    const [errors, setErrors] = useState<{ [key: string]: string }>({});
    const [apiError, setApiError] = useState<string | null>(null);
    const [csvFile, setCsvFile] = useState(null);

    useEffect(() => {
        const fetchSources = async () => {
            try {
                const response = await axios.get<Source[]>('http://localhost:8080/api/sources');
                setSources(response.data);
            } catch (error) {
                console.error('Error fetching sources:', error);
            }
        };
        fetchSources();
    }, []);

    useEffect(() => {
        if (recipe) {
            setName(recipe.name);
            setSubrecipe(recipe.subrecipe);
            setInstructions(recipe.instructions);
            setPeople(recipe.people);
            setServed(recipe.served || '');
            setSourceId(recipe.source?.id || null);
            setPageRef(recipe.pageRef || '');
            setRating(recipe.rating || null);
            setNotes(recipe.notes || '');
            setIngredients(recipe.ingredients || [{ name: '' }]);
        } else {
            setName('');
            setSubrecipe(false);
            setInstructions('');
            setPeople(0);
            setServed('');
            setSourceId(null);
            setPageRef('');
            setRating(null);
            setNotes('');
            setIngredients([{ name: '' }]);
        }
    }, [recipe]);

    const validate = () => {
        const newErrors: { [key: string]: string } = {};
        if (!name) newErrors.name = 'Name is required';
        if (!instructions) newErrors.instructions = 'Instructions are required';
        if (people <= 0) newErrors.people = 'People must be greater than 0';
        ingredients.forEach((ingredient, index) => {
            if (!ingredient.name) newErrors[`ingredient-${index}-name`] = 'Ingredient name is required';
            if (ingredient.amount !== undefined && ingredient.amount < 0) newErrors[`ingredient-${index}-amount`] = 'Amount must be non-negative';
        });
        return newErrors;
    };

    const handleIngredientChange = (index: number, field: string, value: string | number) => {
        const newIngredients = [...ingredients];
        newIngredients[index] = { ...newIngredients[index], [field]: value };
        setIngredients(newIngredients);
    };

    const addIngredient = () => {
        setIngredients([...ingredients, { name: '' }]);
    };

    const removeIngredient = (index: number) => {
        const newIngredients = ingredients.filter((_, i) => i !== index);
        setIngredients(newIngredients);
    };

    const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
        if (event.target.files && recipe) {
            const file = event.target.files[0];
            const formData = new FormData();
            formData.append('file', file);
            try {
                const response = await axios.post(`http://localhost:8080/api/recipes/${recipe.id}/attachments`, formData, {
                    headers: {
                        'Content-Type': 'multipart/form-data'
                    }
                });
                console.log(response);
                setAttachments(response.data.attachments);
                event.target.value = ''; // Clear the file input field
            } catch (error) {
                console.error('Error uploading file:', error);
            }
        }
    };

    const handleDeleteAttachment = async (attachmentId: number) => {
        const response = await axios.delete(`http://localhost:8080/api/recipes/${recipe.id}/attachments/${attachmentId}`);
        setAttachments(response.data.attachments);
    };

    const handleImport = async (event) => {
        event.preventDefault();
        if (!csvFile) {
            alert('Please select a CSV file to import.');
            return;
        }
        const formData = new FormData();
        formData.append('file', csvFile);
        formData.append('recipe', JSON.stringify({
            id: recipe?.id,
            name,
            subrecipe,
            instructions,
            people,
            served,
            sourceId,
            pageRef,
            rating,
            notes,
            ingredients
        }));
        try {
            const response = await axios.post('http://localhost:8080/api/recipes/import-ingredients',
                formData, {
                    headers: {
                        'Content-Type': 'multipart/form-data'
                    }
            });
            console.log("Ingredients imported:", response.data);
            setIngredients(response.data.ingredients);
            setCsvFile(null);
            // @ts-expect-error won't be null
            document.getElementById('csvFileName').value = '';
        } catch (error) {
            console.error('Error importing ingredients:', error);
            setApiError('Failed to import ingredients. Please try again.');
        }
    };

    const handleSubmit = async (event: React.FormEvent) => {
        event.preventDefault();
        const newErrors = validate();
        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            return;
        }
        const newRecipe = {
            id: recipe?.id,
            name,
            subrecipe,
            instructions,
            people,
            served,
            ingredients,
            sourceId,
            pageRef,
            rating,
            notes,
            attachments
        };
        const apiUrl = recipe ? `http://localhost:8080/api/recipes/${recipe.id}` : `http://localhost:8080/api/recipes`;
        try {
            const response = recipe ? await axios.put(apiUrl, newRecipe) : await axios.post(apiUrl, newRecipe);
            console.log("Recipe saved:", response.data);
            setName('');
            setSubrecipe(false);
            setInstructions('');
            setPeople(0);
            setServed('');
            setSourceId(null);
            setPageRef('');
            setRating(null);
            setNotes('');
            setIngredients([{ name: '' }]);
            setAttachments([{ id: 0 }]);
            setErrors({});
            setApiError(null);
            onRecipeSaved();
        } catch (error) {
            console.error('Error saving recipe:', error);
            setApiError('Failed to save recipe. Please try again.');
        }
    };

    return (
        <form onSubmit={handleSubmit} className="recipe-form">
            <h2>{recipe ? 'Edit Recipe' : 'Add a New Recipe'}</h2>
            <div className="form-group">
                <label>Name:</label>
                <input type="text" value={name} onChange={(e) => setName(e.target.value)}/>
                {errors.name && <p className="error">{errors.name}</p>}
            </div>
            <div className="form-group">

                <label>
                    <input type="checkbox" checked={subrecipe} onChange={(e) => setSubrecipe(e.target.checked)}/>
                    Is subrecipe
                </label>
            </div>
            <div className="form-group">
                <label>Instructions:</label>
                <textarea value={instructions} onChange={(e) => setInstructions(e.target.value)}/>
                {errors.instructions && <p className="error">{errors.instructions}</p>}
            </div>
            <div className="form-group">
                <label>People:</label>
                <input type="number" value={people} onChange={(e) => setPeople(parseInt(e.target.value))}/>
                {errors.people && <p className="error">{errors.people}</p>}
            </div>
            <div className="form-group">
                <label>Served:</label>
                <textarea value={served} onChange={(e) => setServed(e.target.value)}/>
            </div>
            <div className="form-group">
                <label>Source:</label>
                <select value={sourceId ?? ''}
                        onChange={(e) => setSourceId(e.target.value ? parseInt(e.target.value) : null)}>
                    <option value="">Select a source</option>
                    {sources.map((source) => (
                        <option key={source.id} value={source.id}>
                            {source.name}
                        </option>
                    ))}
                </select>
            </div>
            <div className="form-group">
                <label>Page Reference:</label>
                <input type="text" value={pageRef} onChange={(e) => setPageRef(e.target.value)}/>
            </div>
            <div className="form-group">
                <label>Rating:</label>
                <input type="number" min="1" max="6" value={rating ?? ''}
                       onChange={(e) => setRating(parseInt(e.target.value))}/>
            </div>
            <div className="form-group">
                <label>Notes:</label>
                <textarea value={notes} onChange={(e) => setNotes(e.target.value)}/>
            </div>
            <div className="form-group">
                <label>Attachments</label>
                <input type="file" onChange={handleFileChange}/>
                <ul>
                    {attachments.map(attachment => (
                        <li key={attachment.id}>
                            {attachment.fileName}
                            &nbsp;
                            <button onClick={() => handleDeleteAttachment(attachment.id)}>Delete</button>
                        </li>
                    ))}
                </ul>
            </div>
            <div className="form-group">
                <label>Ingredients:</label>
                <table className="ingredient-table">
                    <thead>
                    <tr>
                        <th>Amount</th>
                        <th>Measure</th>
                        <th>Name</th>
                        <th>Instruction</th>
                        <th>!</th>
                    </tr>
                    </thead>
                    <tbody>
                    {ingredients.map((ingredient, index) => (
                        <tr key={index}>
                            <td>
                                <input
                                    type="number"
                                    placeholder="Amount"
                                    value={ingredient.amount ?? ''}
                                    onChange={(e) => handleIngredientChange(index, 'amount', parseFloat(e.target.value))}
                                />
                                {errors[`ingredient-${index}-amount`] &&
                                    <p className="error">{errors[`ingredient-${index}-amount`]}</p>}
                            </td>
                            <td>
                                <select
                                    value={ingredient.measure ?? ''}
                                    onChange={(e) => handleIngredientChange(index, 'measure', e.target.value)}
                                >
                                    {measureOptions.map(option => (
                                        <option key={option} value={option}>{option}</option>
                                    ))}
                                </select>
                                {errors[`ingredient-${index}-measure`] &&
                                    <p className="error">{errors[`ingredient-${index}-measure`]}</p>}
                            </td>
                            <td>
                                <input
                                    type="text"
                                    placeholder="Name"
                                    value={ingredient.name}
                                    onChange={(e) => handleIngredientChange(index, 'name', e.target.value)}
                                />
                                {errors[`ingredient-${index}-name`] &&
                                    <p className="error">{errors[`ingredient-${index}-name`]}</p>}
                            </td>
                            <td>
                                <input
                                    type="text"
                                    placeholder="Instruction"
                                    value={ingredient.instruction ?? ''}
                                    onChange={(e) => handleIngredientChange(index, 'instruction', e.target.value)}
                                />
                            </td>
                            <td>
                                <button type="button" onClick={() => removeIngredient(index)}>Remove</button>
                            </td>
                        </tr>
                    ))}
                    </tbody>
                </table>
                <button type="button" onClick={addIngredient}>Add Ingredient</button>
            </div>
            <div className="form-group">
                <label>Import Ingredients from CSV:</label>
                <input id="csvFileName" type="file" accept=".csv,.txt" onChange={(e) => setCsvFile(e.target.files[0])}/>
                <button type="button" onClick={handleImport}>Import</button>
            </div>

            {apiError && <p className="error">{apiError}</p>}
            <div className="form-actions">
                <button type="submit">{recipe ? 'Save Recipe' : 'Add Recipe'}</button>
                <button type="button" onClick={onCancel}>Cancel</button>
            </div>
        </form>
    );
}

export default RecipeForm;
