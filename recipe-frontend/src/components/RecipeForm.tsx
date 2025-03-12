import React, { useState, useEffect } from 'react';
import axios from 'axios';

interface RecipeFormProps {
    onRecipeCreated: () => void;
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

interface Attachment {
    id: number;
    fileName: string;
    fileType: string;
    data: string; // Base64 encoded
}

const measureOptions = [
    '', 'ts', 'tsp', 'tbsp', 'ss', 'ml', 'cl', 'dl', 'l', 'mg', 'g', 'kg', 'stk', 'pcs', 'kopper', 'cups'
];

function RecipeForm({ onRecipeCreated }: RecipeFormProps) {
    const [name, setName] = useState('');
    const [instructions, setInstructions] = useState('');
    const [people, setPeople] = useState(0);
    const [served, setServed] = useState('');
    const [sourceId, setSourceId] = useState<number | null>(null);
    const [sources, setSources] = useState<Source[]>([]);
    const [pageRef, setPageRef] = useState('');
    const [rating, setRating] = useState<number | null>(null); // New field
    const [notes, setNotes] = useState(''); // New field
    const [ingredients, setIngredients] = useState<Ingredient[]>([{ name: '' }]);
    const [attachments, setAttachments] = useState<Attachment[]>([]);

    const [errors, setErrors] = useState<{ [key: string]: string }>({});
    const [apiError, setApiError] = useState<string | null>(null);

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

    const handleAttachmentChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        if (event.target.files) {
            const file = event.target.files[0];
            const reader = new FileReader();
            reader.onloadend = () => {
                setAttachments([...attachments, {
                    id: 0,
                    fileName: file.name,
                    fileType: file.type,
                    data: reader.result as string
                }]);
            };
            reader.readAsDataURL(file);
        }
    };

    const addIngredient = () => {
        setIngredients([...ingredients, { name: '' }]);
    };

    const removeIngredient = (index: number) => {
        const newIngredients = ingredients.filter((_, i) => i !== index);
        setIngredients(newIngredients);
    };

    const removeAttachment = (index: number) => {
        const newAttachments = attachments.filter((_, i) => i !== index);
        setAttachments(newAttachments);
    };

    const handleSubmit = async (event: React.FormEvent) => {
        event.preventDefault();
        const newErrors = validate();
        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            return;
        }
        const newRecipe = { name, instructions, people, served, ingredients, attachments, sourceId, pageRef, rating, notes };
        console.log('New recipe:', newRecipe);
        const apiUrl = 'http://localhost:8080/api/recipes';
        try {
            const response = await axios.post(apiUrl, newRecipe);
            console.log('Recipe created:', response.data);
            setName('');
            setInstructions('');
            setPeople(0);
            setServed('');
            setSourceId(null);
            setPageRef('');
            setRating(null);
            setNotes('');
            setIngredients([{ name: '' }]);
            setAttachments([]);
            setErrors({});
            setApiError(null);
            onRecipeCreated();
        } catch (error) {
            console.error('Error creating recipe:', error);
            setApiError('Failed to create recipe. Please try again.');
        }
    };

    return (
        <form onSubmit={handleSubmit}>
            <h2>Add a New Recipe</h2>
            <div>
                <label>Name:</label>
                <input type="text" value={name} onChange={(e) => setName(e.target.value)} />
                {errors.name && <p className="error">{errors.name}</p>}
            </div>
            <div>
                <label>Instructions:</label>
                <textarea value={instructions} onChange={(e) => setInstructions(e.target.value)} />
                {errors.instructions && <p className="error">{errors.instructions}</p>}
            </div>
            <div>
                <label>People:</label>
                <input type="number" value={people} onChange={(e) => setPeople(parseInt(e.target.value))} />
                {errors.people && <p className="error">{errors.people}</p>}
            </div>
            <div>
                <label>Served:</label>
                <textarea value={served} onChange={(e) => setServed(e.target.value)} />
            </div>
            <div>
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
            <div>
                <label>Page Reference:</label>
                <input type="text" value={pageRef} onChange={(e) => setPageRef(e.target.value)}/>
            </div>
            <div>
                <label>Rating:</label>
                <input type="number" min="1" max="6" value={rating ?? ''} onChange={(e) => setRating(parseInt(e.target.value))} />
            </div>
            <div>
                <label>Notes:</label>
                <textarea value={notes} onChange={(e) => setNotes(e.target.value)} />
            </div>
            <div>
                <label>Ingredients:</label>
                {ingredients.map((ingredient, index) => (
                    <div key={index}>
                        <input
                            type="number"
                            placeholder="Amount"
                            value={ingredient.amount ?? ''}
                            onChange={(e) => handleIngredientChange(index, 'amount', parseFloat(e.target.value))}
                        />
                        {errors[`ingredient-${index}-amount`] && <p className="error">{errors[`ingredient-${index}-amount`]}</p>}
                        <select
                            value={ingredient.measure ?? ''}
                            onChange={(e) => handleIngredientChange(index, 'measure', e.target.value)}
                        >
                            {measureOptions.map(option => (
                                <option key={option} value={option}>{option}</option>
                            ))}
                        </select>
                        {errors[`ingredient-${index}-measure`] && <p className="error">{errors[`ingredient-${index}-measure`]}</p>}
                        <input
                            type="text"
                            placeholder="Name"
                            value={ingredient.name}
                            onChange={(e) => handleIngredientChange(index, 'name', e.target.value)}
                        />
                        {errors[`ingredient-${index}-name`] && <p className="error">{errors[`ingredient-${index}-name`]}</p>}
                        <input
                            type="text"
                            placeholder="Instruction"
                            value={ingredient.instruction ?? ''}
                            onChange={(e) => handleIngredientChange(index, 'instruction', e.target.value)}
                        />
                        <button type="button" onClick={() => removeIngredient(index)}>Remove</button>
                    </div>
                ))}
                <button type="button" onClick={addIngredient}>Add Ingredient</button>
            </div>
            <div>
                <label>Attachments:</label>
                <input type="file" onChange={handleAttachmentChange} />
                <ul>
                    {attachments.map((attachment, index) => (
                        <li key={index}>
                            {attachment.fileName}
                            <button type="button" onClick={() => removeAttachment(index)}>Remove</button>
                        </li>
                    ))}
                </ul>
            </div>
            {apiError && <p className="error">{apiError}</p>}
            <button type="submit">Add Recipe</button>
        </form>
    );
}

export default RecipeForm;
