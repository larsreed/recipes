import React, { useState } from 'react';
import axios from 'axios';

interface SourceFormProps {
    onSourceCreated: () => void;
}

function SourceForm({ onSourceCreated }: SourceFormProps) {
    const [name, setName] = useState('');
    const [authors, setAuthors] = useState('');
    const [errors, setErrors] = useState<{ [key: string]: string }>({});
    const [apiError, setApiError] = useState<string | null>(null);

    const validate = () => {
        const newErrors: { [key: string]: string } = {};
        if (!name) newErrors.name = 'Name is required';
        if (!authors) newErrors.authors = 'Authors are required';
        return newErrors;
    };

    const handleSubmit = async (event: React.FormEvent) => {
        event.preventDefault();
        const newErrors = validate();
        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            return;
        }
        const newSource = { name, authors };
        const apiUrl = 'http://localhost:8080/api/sources';
        try {
            const response = await axios.post(apiUrl, newSource);
            console.log('Source created:', response.data);
            setName('');
            setAuthors('');
            setErrors({});
            setApiError(null);
            onSourceCreated();
        } catch (error) {
            console.error('Error creating source:', error);
            setApiError('Failed to create source. Please try again.');
        }
    };

    return (
        <form onSubmit={handleSubmit}>
            <h2>Add a New Source</h2>
            <div>
                <label>Name:</label>
                <input type="text" value={name} onChange={(e) => setName(e.target.value)} />
                {errors.name && <p className="error">{errors.name}</p>}
            </div>
            <div>
                <label>Authors:</label>
                <input type="text" value={authors} onChange={(e) => setAuthors(e.target.value)} />
                {errors.authors && <p className="error">{errors.authors}</p>}
            </div>
            {apiError && <p className="error">{apiError}</p>}
            <button type="submit">Add Source</button>
        </form>
    );
}

export default SourceForm;
