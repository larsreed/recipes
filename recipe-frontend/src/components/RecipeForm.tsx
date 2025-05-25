import React, { useState, useEffect } from 'react';
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
    matchFor?: string;
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
    prefix?: string;
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
    const [isDirty, setIsDirty] = useState(false);
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
    const [matchFor, setMatchFor] = useState(recipe?.matchFor || null);
    const [notes, setNotes] = useState(recipe?.notes || '');
    const [ingredients, setIngredients] = useState<Ingredient[]>(
        recipe?.ingredients || [{ prefix: undefined, amount: undefined, name: '', instruction: undefined, measure: undefined }]
    );
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
            setMatchFor(recipe.matchFor || null);
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
            setMatchFor(null)
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

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                if (isDirty) {
                    const confirmClose = window.confirm('You have unsaved changes. Do you really want to close?');
                    if (confirmClose) {
                        onCancel();
                    }
                } else {
                    onCancel();
                }
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, [isDirty, onCancel]);

    const handleChange = (setter: React.Dispatch<React.SetStateAction<any>>, value: any) => {
        setter(value);
        setIsDirty(true);
    };

    const handleAddSubrecipe = () => {
        if (selectedSubrecipeId !== null) {
            const selectedSubrecipe = availableRecipes.find(recipe => recipe.id === selectedSubrecipeId);
            if (selectedSubrecipe) {
                setIsDirty(true);
                setSubrecipes([...subrecipes, selectedSubrecipe]);
            }
        }
    };

    const handleRemoveSubrecipe = (index: number) => {
        const newSubrecipes = [...subrecipes];
        newSubrecipes.splice(index, 1);
        setIsDirty(true);
        setSubrecipes(newSubrecipes);
    };

    const moveSubrecipe = (fromIndex: number, toIndex: number) => {
        if (toIndex < 0 || toIndex >= subrecipes.length) return;
        const updatedSubrecipes = [...subrecipes];
        const [movedSubrecipe] = updatedSubrecipes.splice(fromIndex, 1);
        updatedSubrecipes.splice(toIndex, 0, movedSubrecipe);
        setIsDirty(true);
        setSubrecipes(updatedSubrecipes);
    };


    const handleIngredientChange = (index: number, field: string, value: string | number) => {
        const newIngredients = [...ingredients];
        newIngredients[index] = {...newIngredients[index], [field]: value };
        setIsDirty(true);
        setIngredients(newIngredients);
    };

    const addIngredient = () => {
        setIsDirty(true);
        setIngredients([...ingredients, { prefix: undefined, amount: undefined, name: '', instruction: undefined, measure: undefined }]);
    };

    const removeIngredient = (index: number) => {
        const newIngredients = ingredients.filter((_, i) => i !== index);
        setIsDirty(true);
        setIngredients(newIngredients);
    };

    const moveIngredient = (fromIndex: number, toIndex: number) => {
        if (toIndex < 0 || toIndex >= ingredients.length) return;
        const updatedIngredients = [...ingredients];
        const [movedIngredient] = updatedIngredients.splice(fromIndex, 1);
        updatedIngredients.splice(toIndex, 0, movedIngredient);
        setIsDirty(true);
        setIngredients(updatedIngredients);
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
                setIsDirty(true);
                setAttachments(response.data.attachments);
                event.target.value = ''; // Clear the file input field
            } catch (error) {
                console.error('Error uploading file:', error);
            }
        }
    };

    const handleDeleteAttachment = async (attachmentId: number) => {
        const confirmDelete = window.confirm('Are you sure you want to delete this attachment?');
        if (!confirmDelete) return;
        // @ts-expect-error recipe won't be null
        const response = await axios.delete(`${config.backendUrl}/api/recipes/${recipe.id}/attachments/${attachmentId}`);
        setIsDirty(true);
        setAttachments(response.data.attachments);
    };

    // @ts-expect-error don't care
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
            matchFor,
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
            setName(response.data.name);
            setSubrecipe(response.data.subrecipe);
            setInstructions(response.data.instructions);
            setPeople(response.data.people);
            setServed(response.data.served || '');
            setSourceId(response.data.source?.id || null);
            setPageRef(response.data.pageRef || '');
            setRating(response.data.rating || null);
            setWineTips(response.data.wineTips || null);
            setMatchFor(response.data.matchFor || null);
            setNotes(response.data.notes || '');
            setIngredients(response.data.ingredients || []);
            setSubrecipes(response.data.subrecipes || []);
            setAttachments(response.data.attachments || []);
            setIsDirty(false);
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
            matchFor,
            ingredients: ingredients.map((ingredient, index) => ({
                ...ingredient,
                sortorder: index
            })),
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
            setMatchFor(null)
            setNotes('');
            setIngredients([]);
            setAttachments([]);
            setSubrecipes([]);
            setErrors({});
            setApiError(null);
            setIsDirty(false);
            onRecipeSaved();
        } catch (error) {
            console.error('Error saving recipe:', error);
            console.log(newRecipe);
            setApiError('Failed to save recipe. Please try again.');
        }
    };

    return (
        <form onSubmit={handleSubmit} className="recipe-form">
            <h2>{recipe ? 'Edit Recipe' : 'Add a New Recipe'}</h2>
            <div className="form-line" style={{display: 'flex', gap: '1rem'}}>
                <label>Name:</label>
                <input type="text"
                       value={name}
                       style={{flexGrow: 1}}
                       onChange={(e) => handleChange(setName, e.target.value)}
                />
                {errors.name && <p className="error">{errors.name}</p>}

                <label style={{marginLeft: 'auto'}}>
                    <input type="checkbox"
                           checked={subrecipe}
                           onChange={(e) => handleChange(setSubrecipe, e.target.checked)}
                    />
                    Is subrecipe
                </label>

                <label>People:</label>
                <input type="number"
                       value={people}
                       onChange={(e) => handleChange(setPeople, parseInt(e.target.value))}
                />
                {errors.people && <p className="error">{errors.people}</p>}
            </div>

            <div className="form-group">
                <label>Instructions:</label>
                <textarea value={instructions}
                          onChange={(e) => handleChange(setInstructions, e.target.value)}/>
                {errors.instructions && <p className="error">{errors.instructions}</p>}
            </div>

            <div className="form-line">
                <label>Source:</label>
                <select value={sourceId ?? ''}
                        style={{flexGrow: 0.8}}
                        onChange={(e) => handleChange(setSourceId, e.target.value ? parseInt(e.target.value) : null)}>
                    <option value="">No source</option>
                    {sources.map((source) => (
                        <option key={source.id} value={source.id}>
                            {source.name}
                        </option>
                    ))}
                </select>
                <label>Page Reference:</label>
                <input type="text" value={pageRef}
                       style={{flexGrow: 0.2}}
                       onChange={(e) => handleChange(setPageRef, e.target.value)}/>
            </div>
            <div className="form-line">
                <label>Rating:</label>
                <input type="number" min="1" max="6" value={rating ?? ''}
                       style={{flexGrow: 0.1}}
                       onChange={(e) => handleChange(setRating, parseInt(e.target.value))}/>
                <label>Served:</label>
                <textarea value={served}
                          style={{flexGrow:  0.3}}
                          onChange={(e) => handleChange(setServed, e.target.value)}/>
                <label>Wine tips:</label>
                <input type="text"
                       style={{flexGrow: 0.3}}
                       value={wineTips ?? ''}
                       onChange={(e) => handleChange(setWineTips, e.target.value)}/>
                <label>Good match for:</label>
                <input type="text" value={matchFor ?? ''}
                       style={{flexGrow: 0.3}}
                       onChange={(e) => handleChange(setMatchFor, e.target.value)}/>
            </div>

            <div className="form-group">
                <label>Notes:</label>
                <textarea value={notes} onChange={(e) => handleChange(setNotes ,e.target.value)}/>
            </div>

            {recipe && (
                <div id="attachments" className="form-group">
                    <label>Attachments</label>
                    <input type="file" onChange={handleFileChange} />
                    <table className="attachment-table">
                        <thead>
                        <tr>
                            <th>File</th>
                            <th>!</th>
                        </tr>
                        </thead>
                        <tbody>
                        {attachments.map((attachment) => {
                            const isImage = /\.(gif|png|jpg|jpeg|webp)$/i.test(attachment.fileName);
                            return (
                                <tr key={attachment.id}>
                                    <td>
                                        {attachment.fileName}
                                        {isImage && (

                                            <img
                                                src={`data:image/*;base64,${attachment.fileContent}`}
                                                alt={attachment.fileName}
                                                className="thumbnail"
                                            />
                                        )}
                                    </td>
                                    <td>
                                        <button
                                            onClick={() => handleDeleteAttachment(attachment.id)}
                                            title="Delete"
                                        >
                                            <i className="fas fa-remove"></i>
                                        </button>
                                    </td>
                                </tr>
                            );
                        })}
                        </tbody>
                    </table>
                </div>
            )}

            <div className="form-group">
                <label>Subrecipes:</label>
                <table className="subrecipe-table">
                    <thead>
                    <tr>
                        <th>Name</th>
                        <th>!</th>
                    </tr>
                    </thead>
                    <tbody>
                    {subrecipes.map((subrecipe, index) => (
                        <tr key={subrecipe.id}>
                            <td>{subrecipe.name}</td>
                            <td>
                                <button type="button" onClick={() => moveSubrecipe(index, index - 1)}
                                        disabled={index === 0}
                                        title="Move Up">
                                    <i className="fas fa-arrow-up"></i>
                                </button>
                                <button type="button" onClick={() => moveSubrecipe(index, index + 1)}
                                        disabled={index === ingredients.length - 1}
                                        title="Move Down">
                                    <i className="fas fa-arrow-down"></i>
                                </button>
                                <button type="button" onClick={() => handleRemoveSubrecipe(index)} title="Remove">
                                    <i className="fas fa-remove"></i>
                                </button>
                            </td>
                        </tr>
                    ))}
                    </tbody>
                </table>

                <div className="form-group">
                    <label>Select Subrecipe:</label>
                    <select
                        value={selectedSubrecipeId ?? ''}
                        onChange={(e) => handleChange(setSelectedSubrecipeId, e.target.value ? parseInt(e.target.value) : null)}
                    >
                        <option value="">Select a subrecipe</option>
                        {availableRecipes
                            .filter((recipe) => recipe.subrecipe)
                            .map((recipe) => (
                            <option key={recipe.id} value={recipe.id}>
                                {recipe.name}
                            </option>
                        ))}
                    </select>
                    <button type="button" onClick={handleAddSubrecipe}>Add Subrecipe</button>
                </div>
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
                        <th>Prefix</th>
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
                                    type="text"
                                    placeholder="Prefix"
                                    value={ingredient.prefix ?? ''}
                                    onChange={(e) => handleIngredientChange(index, 'prefix', e.target.value)}
                                />
                                {errors[`ingredient-${index}-prefix`] &&
                                    <p className="error">{errors[`ingredient-${index}-prefix`]}</p>}
                            </td>
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
                                <button type="button" onClick={() => moveIngredient(index, index - 1)}
                                        disabled={index === 0}
                                        title="Move Up">
                                    <i className="fas fa-arrow-up"></i>
                                </button>
                                <button type="button" onClick={() => moveIngredient(index, index + 1)}
                                        disabled={index === ingredients.length - 1}
                                        title="Move Down">
                                    <i className="fas fa-arrow-down"></i>
                                </button>

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
                {csvFile && (<button type="button" onClick={handleImport}>Import</button>)}
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
