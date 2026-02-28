import React, { useState, useEffect } from 'react';
import axios from 'axios';
import config from '../config';
import AutoGrowTextarea from './AutoGrowTextarea.tsx';
import measureOptions from './measureOptions';

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
    instructions?: string;
    closing? : string;
    served?: string;
    sourceId?: number;
    pageRef?: string;
    rating?: number;
    notes?: string;
    wineTips?: string;
    matchFor?: string;
    categories?: string;
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
    preamble?: string;
    amount?: number;
    prefix?: string;
    name: string;
    instruction?: string;
    measure?: string;
}

const predefinedCategories = [
    "Vegetar", "Forrett", "Hovedrett", "Dessert", "Tilbehør", "Bakverk", "Saus", "Drikke", "Fisk", "Frukt",
    "Vegetarian", "Appetizer", "Main Course", "Side disk", "Pastry", "Sauce", "Drinks", "Fish", "Fruit"
];



function RecipeForm({ recipe, onCancel, onRecipeSaved }: RecipeFormProps) {
    const [name, setName] = useState(recipe?.name || '');
    const [subrecipe, setSubrecipe] = useState(recipe?.subrecipe || false);
    const [subrecipes, setSubrecipes] = useState<Recipe[]>([]);
    const [mainRecipes, setMainRecipes] = useState<Recipe[]>([]);
    const [isDirty, setIsDirty] = useState(false);
    const [availableRecipes, setAvailableRecipes] = useState<Recipe[]>([]);
    const [selectedSubrecipeId, setSelectedSubrecipeId] = useState<number | null>(null);
    const [instructions, setInstructions] = useState(recipe?.instructions || null);
    const [closing, setClosing] = useState(recipe?.closing || null);
    const [people, setPeople] = useState(recipe?.people || 4);
    const [served, setServed] = useState(recipe?.served || '');
    const [sourceId, setSourceId] = useState<number | null>(recipe?.source?.id || null);
    const [sources, setSources] = useState<Source[]>([]);
    const [pageRef, setPageRef] = useState(recipe?.pageRef || '');
    const [rating, setRating] = useState<number | null>(recipe?.rating || null);
    const [wineTips, setWineTips] = useState(recipe?.wineTips || null);
    const [matchFor, setMatchFor] = useState(recipe?.matchFor || null);
    const [categories, setCategories] = useState(recipe?.categories?.split('.').map(tag => tag.trim()).filter(tag => tag) || null);
    const [notes, setNotes] = useState(recipe?.notes || '');
    const [ingredients, setIngredients] = useState<Ingredient[]>(
        recipe?.ingredients || [{ preamble: undefined, amount: undefined, prefix: undefined, name: '', instruction: undefined, measure: undefined }]
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
                setApiError('Failed to fetch sources. Please try again.');
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
                setApiError('Failed to fetch recipes. Please try again.');
            }
        };
        fetchRecipes();
    }, []);

    function blankRecipe() {
        setName('');
        setSubrecipe(false);
        setInstructions('');
        setClosing('')
        setPeople(4);
        setServed('');
        setSourceId(null);
        setPageRef('');
        setRating(null);
        setWineTips(null);
        setMatchFor(null)
        setCategories(null);
        setNotes('');
        setIngredients([]);
    }

    useEffect(() => {
        if (recipe) {
            setName(recipe.name);
            setSubrecipe(recipe.subrecipe);
            setInstructions(recipe.instructions || null);
            setClosing(recipe.closing || null);
            setPeople(recipe.people);
            setServed(recipe.served || '');
            setSourceId(recipe.source?.id || null);
            setPageRef(recipe.pageRef || '');
            setRating(recipe.rating || null);
            setWineTips(recipe.wineTips || null);
            setMatchFor(recipe.matchFor || null);
            setCategories(recipe.categories?.split(',').map(tag => tag.trim()).filter(tag => tag) || null);
            setNotes(recipe.notes || '');
            setIngredients(recipe.ingredients || []);
            setSubrecipes(recipe.subrecipes || []);
        } else {
            blankRecipe();
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
                    setApiError('Failed to fetch main recipes. Please try again.');
                });
        }
    }, [recipe]);

    const validate = () => {
        const newErrors: { [key: string]: string } = {};
        if (!name) newErrors.name = 'Name is required';
        if (people < 0) newErrors.people = 'Number of people cannot be negative';
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
        setIngredients([...ingredients, { preamble: undefined, amount: undefined, prefix: undefined, name: '', instruction: undefined, measure: undefined }]);
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
                setIsDirty(true);
                setAttachments(response.data.attachments);
                event.target.value = ''; // Clear the file input field
            } catch (error) {
                console.error('Error uploading file:', error);
                setApiError('Failed to upload file.');
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
            closing,
            people,
            served,
            wineTips,
            matchFor,
            categories,
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
            setInstructions(response.data.instructions || null);
            setClosing(response.data.closing || null);
            setPeople(response.data.people);
            setServed(response.data.served || '');
            setSourceId(response.data.source?.id || null);
            setPageRef(response.data.pageRef || '');
            setRating(response.data.rating || null);
            setWineTips(response.data.wineTips || null);
            setMatchFor(response.data.matchFor || null);
            setCategories(response.data.categories?.split(',').map((tag: string) => tag.trim()).filter((tag: any) => {
                return tag;
            }) || null);
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
            closing,
            people,
            served,
            wineTips,
            matchFor,
            categories: categories ? categories.join(',') : null,
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
        const apiUrl = recipe ? `${config.backendUrl}/api/recipes/${recipe.id}` : `${config.backendUrl}/api/recipes`;
        try {
            // @ts-ignore
            const response = recipe ? await axios.put(apiUrl, newRecipe) : await axios.post(apiUrl, newRecipe);
            if (response.data.error) {
                setApiError(response.data.error);
                return;
            }
            blankRecipe();
            setAttachments([]);
            setSubrecipes([]);
            setErrors({});
            setApiError(null);
            setIsDirty(false);
            onRecipeSaved();
        } catch (error) {
            console.error('Error saving recipe:', error);
            // @ts-ignore
            if (error.response && error.response.data && error.response.data.error) {
                setApiError(error.response.data.error);
            } else {
                setApiError('Failed to save recipe. Please try again.');
            }
        }
    };

    const addCategory = (newCategory: string) => {
        if (newCategory && !categories?.includes(newCategory)) {
            handleChange(setCategories, [...(categories ?? []), newCategory]);
        }
    };
    const removeCategory = (categoryToRemove: string) => {
        handleChange(setCategories, (categories ?? []).filter(cat => cat !== categoryToRemove));
    };

    return (
        <form onSubmit={handleSubmit} className="recipe-form">
            <h2>{recipe ? 'Edit Recipe' : 'Add a New Recipe'}</h2>

            {/* Basic Information Section */}
            <div className="form-section">
                <div className="form-section-title">
                    <i className="fas fa-info-circle"></i>
                    Basic Information
                </div>
                <div className="form-grid">
                    <div className="form-field" style={{gridColumn: '1 / -1'}}>
                        <label>Recipe Name *</label>
                        <input type="text"
                               value={name}
                               onChange={(e) => handleChange(setName, e.target.value)}
                               placeholder="Enter recipe name"
                        />
                        {errors.name && <p className="error">{errors.name}</p>}
                    </div>
                    <div className="form-field">
                        <label>Servings</label>
                        <input type="number"
                               value={people}
                               onChange={(e) => handleChange(setPeople, parseInt(e.target.value))}
                               placeholder="Number of servings"
                        />
                        <small style={{color: 'var(--text-secondary)', fontSize: '0.75rem'}}>Use 0 for fixed amounts</small>
                        {errors.people && <p className="error">{errors.people}</p>}
                    </div>
                    <div className="form-field">
                        <label>Rating</label>
                        <input type="number"
                               min="1"
                               max="6"
                               value={rating ?? ''}
                               onChange={(e) => handleChange(setRating, parseInt(e.target.value))}
                               placeholder="1-6"
                        />
                    </div>
                </div>
                <div className="form-field-inline" style={{marginTop: '0.75rem'}}>
                    <input type="checkbox"
                           checked={subrecipe}
                           onChange={(e) => handleChange(setSubrecipe, e.target.checked)}
                           id="subrecipe-check"
                    />
                    <label htmlFor="subrecipe-check" style={{margin: 0}}>This is a subrecipe</label>
                </div>
            </div>

            {/* Categories Section */}
            <div className="form-section">
                <div className="form-section-title">
                    <i className="fas fa-tags"></i>
                    Categories
                </div>
                <div className="form-field">
                    <select
                        onChange={e => {
                            addCategory(e.target.value);
                            e.target.value = "";
                        }}
                        defaultValue=""
                    >
                        <option value="" disabled>Add category...</option>
                        {predefinedCategories
                            .filter(cat => !(categories ?? []).includes(cat))
                            .map(cat => (
                                <option key={cat} value={cat}>{cat}</option>
                            ))}
                    </select>
                    <div className="category-container">
                        {(categories ?? []).map(cat => (
                            <span key={cat} className="category">
                                {cat}
                                <button type="button" onClick={() => removeCategory(cat)}>×</button>
                            </span>
                        ))}
                    </div>
                </div>
            </div>

            {/* Instructions Section */}
            <div className="form-section">
                <div className="form-section-title">
                    <i className="fas fa-list-ol"></i>
                    Instructions
                </div>
                <div className="form-field">
                    <label>Preparation Instructions (markdown)</label>
                    <AutoGrowTextarea
                        value={instructions ?? ''}
                        onChange={(e) => handleChange(setInstructions, e.target.value)}
                        placeholder="Enter step-by-step instructions..."
                    />
                    {errors.instructions && <p className="error">{errors.instructions}</p>}
                </div>
                <div className="form-field" style={{marginTop: '0.75rem'}}>
                    <label>Closing Instructions (markdown)</label>
                    <AutoGrowTextarea
                        value={closing ?? ''}
                        onChange={(e) => handleChange(setClosing, e.target.value)}
                        placeholder="Final steps, serving suggestions..."
                    />
                    {errors.closing && <p className="error">{errors.closing}</p>}
                </div>
            </div>

            {/* Source and Reference Section */}
            <div className="form-section">
                <div className="form-section-title">
                    <i className="fas fa-book"></i>
                    Source & Reference
                </div>
                <div className="form-grid">
                    <div className="form-field">
                        <label>Source</label>
                        <select value={sourceId ?? ''}
                                onChange={(e) => handleChange(setSourceId, e.target.value ? parseInt(e.target.value) : null)}>
                            <option value="">No source</option>
                            {sources.map((source) => (
                                <option key={source.id} value={source.id}>
                                    {source.name}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div className="form-field">
                        <label>Page Reference</label>
                        <input type="text"
                               value={pageRef}
                               onChange={(e) => handleChange(setPageRef, e.target.value)}
                               placeholder="e.g., p. 42"
                        />
                    </div>
                </div>
            </div>

            {/* Additional Details Section */}
            <div className="form-section">
                <div className="form-section-title">
                    <i className="fas fa-utensils"></i>
                    Additional Details
                </div>
                <div className="form-grid">
                    <div className="form-field">
                        <label>Served</label>
                        <AutoGrowTextarea
                            value={served}
                            onChange={(e) => handleChange(setServed, e.target.value)}
                            placeholder="How is this served?"
                        />
                    </div>
                    <div className="form-field">
                        <label>Wine Tips</label>
                        <input type="text"
                               value={wineTips ?? ''}
                               onChange={(e) => handleChange(setWineTips, e.target.value)}
                               placeholder="Wine pairing suggestions"
                        />
                    </div>
                    <div className="form-field">
                        <label>Good Match For</label>
                        <input type="text"
                               value={matchFor ?? ''}
                               onChange={(e) => handleChange(setMatchFor, e.target.value)}
                               placeholder="What does this go well with?"
                        />
                    </div>
                    <div className="form-field">
                        <label>Notes (markdown)</label>
                        <AutoGrowTextarea
                            value={notes}
                            onChange={(e) => handleChange(setNotes, e.target.value)}
                            placeholder="Any additional notes..."
                        />
                    </div>
                </div>
            </div>

            {/* Attachments Section */}
            {recipe && (
                <div className="form-section">
                    <div className="form-section-title">
                        <i className="fas fa-paperclip"></i>
                        Attachments
                    </div>
                    <input type="file" onChange={handleFileChange}/>
                    <table className="attachment-table">
                        <thead>
                        <tr>
                            <th>File</th>
                            <th style={{width: '80px'}}>Actions</th>
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
                                            className="btn-danger"
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

            {/* Subrecipes Section */}
            <div className="form-section">
                <div className="form-section-title">
                    <i className="fas fa-sitemap"></i>
                    Subrecipes
                </div>
                {subrecipes.length > 0 && (
                    <table className="subrecipe-table">
                        <thead>
                        <tr>
                            <th>Name</th>
                            <th style={{width: '140px'}}>Actions</th>
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
                                            disabled={index === subrecipes.length - 1}
                                            title="Move Down">
                                        <i className="fas fa-arrow-down"></i>
                                    </button>
                                    <button type="button" onClick={() => handleRemoveSubrecipe(index)} title="Remove" className="btn-danger">
                                        <i className="fas fa-remove"></i>
                                    </button>
                                </td>
                            </tr>
                        ))}
                        </tbody>
                    </table>
                )}

                <div className="form-grid" style={{marginTop: '0.75rem'}}>
                    <div className="form-field" style={{gridColumn: '1 / -1'}}>
                        <label>Add Subrecipe</label>
                        <div style={{display: 'flex', gap: '0.5rem'}}>
                            <select
                                style={{flex: 1}}
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
                            <button type="button" onClick={handleAddSubrecipe} className="add-item-button">
                                <i className="fas fa-plus"></i>
                                Add
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Referenced By Section */}
            {recipe?.subrecipe && mainRecipes.length > 0 && (
                <div className="referenced-by">
                    <h3><i className="fas fa-link"></i> Referenced by</h3>
                    <ul>
                        {mainRecipes.map(mainRecipe => (
                            <li key={mainRecipe.id}>{mainRecipe.name}</li>
                        ))}
                    </ul>
                </div>
            )}

            {/* Ingredients Section */}
            <div className="form-section">
                <div className="form-section-title">
                    <i className="fas fa-carrot"></i>
                    Ingredients
                </div>
                <table className="ingredient-table">
                    <thead>
                    <tr>
                        <th>Preamble</th>
                        <th style={{width: '80px'}}>Amount</th>
                        <th style={{width: '100px'}}>Measure</th>
                        <th>Prefix</th>
                        <th>Name</th>
                        <th>Instructions</th>
                        <th style={{width: '100px'}}>Actions</th>
                    </tr>
                    </thead>
                    <tbody>
                    {ingredients.map((ingredient, index) => (
                        <tr key={index}>
                            <td>
                                <AutoGrowTextarea
                                    value={ingredient.preamble ?? ''}
                                    onChange={(e) => handleIngredientChange(index, 'preamble', e.target.value)}
                                    placeholder="Preamble"
                                />
                                {errors[`ingredient-${index}-preamble`] &&
                                    <p className="error">{errors[`ingredient-${index}-preamble`]}</p>}
                            </td>
                            <td>
                                <input
                                    type="number"
                                    placeholder="Amt"
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
                                    placeholder="Prefix"
                                    value={ingredient.prefix}
                                    onChange={(e) => handleIngredientChange(index, 'prefix', e.target.value)}
                                />
                                {errors[`ingredient-${index}-prefix`] &&
                                    <p className="error">{errors[`ingredient-${index}-prefix`]}</p>}
                            </td>
                            <td>
                                <input
                                    type="text"
                                    placeholder="Name *"
                                    value={ingredient.name}
                                    onChange={(e) => handleIngredientChange(index, 'name', e.target.value)}
                                />
                                {errors[`ingredient-${index}-name`] &&
                                    <p className="error">{errors[`ingredient-${index}-name`]}</p>}
                            </td>
                            <td>
                                <AutoGrowTextarea
                                    value={ingredient.instruction ?? ''}
                                    onChange={(e) => handleIngredientChange(index, 'instruction', e.target.value)}
                                    placeholder="Instructions"
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
                                <button type="button" onClick={() => removeIngredient(index)} title="Remove" className="btn-danger">
                                    <i className="fas fa-remove"></i>
                                </button>
                            </td>
                        </tr>
                    ))}
                    </tbody>
                </table>
                <button type="button" onClick={addIngredient} className="add-item-button">
                    <i className="fas fa-plus"></i>
                    Add Ingredient
                </button>
            </div>

            {/* Import Ingredients Section */}
            <div className="import-section">
                <label>
                    <i className="fas fa-file-import"></i>
                    Import Ingredients from CSV
                </label>
                <input id="csvFileName" type="file" accept=".csv,.txt"
                       onChange={(e) => {
                           // @ts-expect-error won't be null
                           setCsvFile(e.target.files[0]);
                       }}/>
                {csvFile && (
                    <button type="button" onClick={handleImport} className="btn-success" style={{marginTop: '0.5rem'}}>
                        <i className="fas fa-upload"></i>
                        Import
                    </button>
                )}
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
