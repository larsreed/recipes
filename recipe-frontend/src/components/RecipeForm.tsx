import React, { useState, useEffect } from 'react';
import { useDrag, useDrop, DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import axios from 'axios';
import config from '../config';

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
    wineTips?: string;
    ingredients: Ingredient[];
    source?: Source;
    attachments: Attachment[];
    subrecipes?: Recipe[];
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
    const [subrecipes, setSubrecipes] = useState<Recipe[]>([]);
    const [mainRecipes, setMainRecipes] = useState<Recipe[]>([]);
    const [availableRecipes, setAvailableRecipes] = useState<Recipe[]>([]);
    const [selectedSubrecipeId, setSelectedSubrecipeId] = useState<number | null>(null);
    const [instructions, setInstructions] = useState(recipe?.instructions || '');
    const [people, setPeople] = useState(recipe?.people || 4);
    const [served, setServed] = useState(recipe?.served || '');
    const [sourceId, setSourceId] = useState<number | null>(recipe?.source?.id || null);
    const [sources, setSources] = useState<Source[]>([]);
    const [pageRef, setPageRef] = useState(recipe?.pageRef || '');
    const [rating, setRating] = useState<number | null>(recipe?.rating || null);
    const [wineTips, setWineTips] = useState(recipe?.wineTips || null);
    const [notes, setNotes] = useState(recipe?.notes || '');
    const [ingredients, setIngredients] = useState<Ingredient[]>(recipe?.ingredients || [{ name: '' }]);
    const [attachments, setAttachments] = useState<Attachment[]>(recipe?.attachments || []);

    const [errors, setErrors] = useState<{ [key: string]: string }>({});
    const [apiError, setApiError] = useState<string | null>(null);
    const [csvFile, setCsvFile] = useState(null);

    useEffect(() => {
        const fetchSources = async () => {
            try {
                const response = await axios.get<Source[]>(`${config.backendUrl}/api/sources`);
                setSources(response.data);
            } catch (error) {
                console.error('Error fetching sources:', error);
            }
        };
        fetchSources();
    }, []);

    useEffect(() => {
        const fetchRecipes = async () => {
            try {
                const response = await axios.get<Recipe[]>(`${config.backendUrl}/api/recipes?includeSubrecipes=true`);
                setAvailableRecipes(response.data);
            } catch (error) {
                console.error('Error fetching recipes:', error);
            }
        };
        fetchRecipes();
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
            setWineTips(recipe.wineTips || null);
            setNotes(recipe.notes || '');
            setIngredients(recipe.ingredients || []);
            setSubrecipes(recipe.subrecipes || []);
        } else {
            setName('');
            setSubrecipe(false);
            setInstructions('');
            setPeople(4);
            setServed('');
            setSourceId(null);
            setPageRef('');
            setRating(null);
            setWineTips(null);
            setNotes('');
            setIngredients([]);
        }
    }, [recipe]);

    useEffect(() => {
        if (recipe && recipe.subrecipe) {
            axios.get(`${config.backendUrl}/api/recipes/references/${recipe.id}`)
                .then(response => {
                    setMainRecipes(response.data);
                })
                .catch(error => {
                    console.error('Error fetching main recipes:', error);
                });
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

    const handleAddSubrecipe = () => {
        if (selectedSubrecipeId !== null) {
            const selectedSubrecipe = availableRecipes.find(recipe => recipe.id === selectedSubrecipeId);
            if (selectedSubrecipe) {
                setSubrecipes([...subrecipes, selectedSubrecipe]);
            }
        }
    };

    const handleRemoveSubrecipe = (index: number) => {
        const newSubrecipes = [...subrecipes];
        newSubrecipes.splice(index, 1);
        setSubrecipes(newSubrecipes);
    };

    const moveSubrecipe = (fromIndex: number, toIndex: number) => {
        const updatedSubrecipes = [...subrecipes];
        const [movedSubrecipe] = updatedSubrecipes.splice(fromIndex, 1);
        updatedSubrecipes.splice(toIndex, 0, movedSubrecipe);
        setSubrecipes(updatedSubrecipes);
    };

    const ItemType = 'SUBRECIPE';

    const DraggableSubrecipe = ({ subrecipe, index, moveSubrecipe }) => {
        const [, ref] = useDrag({
            type: ItemType,
            item: { index },
        });

        const [, drop] = useDrop({
            accept: ItemType,
            hover: (draggedItem) => {
                if (draggedItem.index !== index) {
                    moveSubrecipe(draggedItem.index, index);
                    draggedItem.index = index;
                }
            },
        });

        return (
            // @ts-expect-error look at later
            <div class="subrecipe-item" ref={(node) => ref(drop(node))}>
                <span>{subrecipe.name}</span>
                &nbsp;
                <button onClick={() => handleRemoveSubrecipe(index)} title="Remove">
                    <i className="fas fa-remove"></i>
                </button>
            </div>
        );
    };

    const handleIngredientChange = (index: number, field: string, value: string | number) => {
        const newIngredients = [...ingredients];
        newIngredients[index] = {...newIngredients[index], [field]: value };
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
                const response = await axios.post(`${config.backendUrl}/api/recipes/${recipe.id}/attachments`, formData, {
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
        const response = await axios.delete(`${config.backendUrl}/api/recipes/${recipe.id}/attachments/${attachmentId}`);
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
            wineTips,
            sourceId,
            pageRef,
            rating,
            notes,
            ingredients
        }));
        try {
            const response = await axios.post(`${config.backendUrl}/api/recipes/import-ingredients`,
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
            wineTips,
            ingredients,
            sourceId,
            pageRef,
            rating,
            notes,
            attachments,
            subrecipes: subrecipes.map(subrecipe => subrecipe.id)
        };
        console.log("Recipe is ", newRecipe)
        const apiUrl = recipe ? `${config.backendUrl}/api/recipes/${recipe.id}` : `${config.backendUrl}/api/recipes`;
        try {
            const response = recipe ? await axios.put(apiUrl, newRecipe) : await axios.post(apiUrl, newRecipe);
            console.log("Recipe saved:", response.data);
            setName('');
            setSubrecipe(false);
            setInstructions('');
            setPeople(4);
            setServed('');
            setSourceId(null);
            setPageRef('');
            setRating(null);
            setWineTips(null);
            setNotes('');
            setIngredients([]);
            setAttachments([]);
            setSubrecipes([]);
            setErrors({});
            setApiError(null);
            onRecipeSaved();
        } catch (error) {
            console.error('Error saving recipe:', error);
            console.log(newRecipe);
            setApiError('Failed to save recipe. Please try again.');
        }
    };

    return (
        <DndProvider backend={HTML5Backend}>
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
                        <option value="">No source</option>
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
                    <label>Wine tips:</label>
                    <input type="text" value={wineTips ?? ''} onChange={(e) => setWineTips(e.target.value)}/>
                </div>
                <div className="form-group">
                    <label>Notes:</label>
                    <textarea value={notes} onChange={(e) => setNotes(e.target.value)}/>
                </div>
                {recipe && (
                    <div id="attachments" className="form-group">
                        <label>Attachments</label>
                        <input type="file" onChange={handleFileChange}/>
                        <ul>
                            {attachments.map(attachment => (
                                <li key={attachment.id}>
                                    {attachment.fileName}
                                    &nbsp;
                                    <button onClick={() => handleDeleteAttachment(attachment.id)} title="Delete">
                                        <i className="fas fa-remove"></i>
                                    </button>
                                </li>
                            ))}
                        </ul>
                    </div>
                )}
                <div className="form-group">
                <label>Select Subrecipe:</label>
                    <select value={selectedSubrecipeId ?? ''}
                            onChange={(e) => setSelectedSubrecipeId(e.target.value ? parseInt(e.target.value) : null)}>
                        <option value="">Select a subrecipe</option>
                        {availableRecipes.map((recipe) => (
                            <option key={recipe.id} value={recipe.id}>
                                {recipe.name}
                            </option>
                        ))}
                    </select>
                    <button type="button" onClick={handleAddSubrecipe}>Add Subrecipe</button>
                </div>
                <div className="form-group">
                    {subrecipes.map((subrecipe, index) => (
                        <DraggableSubrecipe
                            key={subrecipe.id}
                            index={index}
                            subrecipe={subrecipe}
                            moveSubrecipe={moveSubrecipe}
                        />
                    ))}
                </div>
                {recipe?.subrecipe && mainRecipes.length > 0 && (
                    <div className="form-group">
                        <h3>Referenced by</h3>
                        <ul>
                            {mainRecipes.map(mainRecipe => (
                                <li key={mainRecipe.id}>{mainRecipe.name}</li>
                            ))}
                        </ul>
                    </div>
                )}
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
                                    <button type="button" onClick={() => removeIngredient(index)} title="Remove">
                                        <i className="fas fa-remove"></i>
                                    </button>
                                </td>
                            </tr>
                        ))}
                        </tbody>
                    </table>
                    <button type="button" onClick={addIngredient}>Add Ingredient</button>
                </div>
                <div className="form-group">
                    <label>Import Ingredients from CSV:</label>
                    <input id="csvFileName" type="file" accept=".csv,.txt"
                           onChange={(e) => setCsvFile(e.target.files[0])}/>
                    <button type="button" onClick={handleImport}>Import</button>
                </div>

                {apiError && <p className="error">{apiError}</p>}
                <div className="form-actions">
                    <button type="submit">{recipe ? 'Save Recipe' : 'Add Recipe'}</button>
                    <button type="button" onClick={onCancel}>Cancel</button>
                </div>
            </form>
        </DndProvider>
    );
}

export default RecipeForm;
