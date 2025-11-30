import React, { useState, useEffect } from 'react';
import axios from "axios";
import config from '../config';
import AutoGrowTextarea from './AutoGrowTextarea.tsx';


interface Source {
    id: number;
    name: string;
    authors: string;
    info?: string;
    title?: string;
}

interface SourceFormProps {
    source?: Source;
    onCancel: () => void;
    onSourceCreated?: () => void;
    onSave?: (source: Source) => Promise<void>;
}

function SourceForm({ source, onCancel, onSourceCreated }: SourceFormProps) {
    const [name, setName] = useState(source?.name || '');
    const [authors, setAuthors] = useState(source?.authors || '');
    const [info, setInfo] = useState(source?.info || '');
    const [title, setTitle] = useState(source?.title || '');

    useEffect(() => {
        if (source) {
            setName(source.name);
            setAuthors(source.authors);
            setInfo(source.info || '');
            setTitle(source.title || '');
        } else {
            setName('');
            setAuthors('');
            setInfo('');
            setTitle('');
        }
    }, [source]);

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
        const newSource = { ...source, name, authors, info, title };
        const apiUrl = source ? `${config.backendUrl}/api/sources/${source.id}` : `${config.backendUrl}/api/sources`;
        try {
            const checkUrl = `${config.backendUrl}/api/sources/check-name?name=${encodeURIComponent(name)}&id=${source ? source.id : -1}`;
            const getResponse = await axios.get(checkUrl);
            if (getResponse.data.exists) {
                setApiError('Source name must be unique');
                return;
            }
            console.log(newSource);
            // @ts-ignore
            const response = source ? await axios.put(apiUrl, newSource) : await axios.post(apiUrl, newSource);
            setName('');
            setAuthors('');
            setInfo('');
            setTitle('');
            setErrors({});
            setApiError(null);
            if (onSourceCreated) onSourceCreated();
        } catch (error) {
            console.error('Error saving source:', error);
            setApiError('Failed to save source. Please try again.');
        }
    };

    const handleCancel = () => {
        setName('');
        setAuthors('');
        setInfo('');
        setTitle('');
        setErrors({});
        setApiError(null);
        onCancel();
    };

    return (
        <form onSubmit={handleSubmit} className="source-form">
            <h2>{source ? 'Edit Source' : 'Add a New Source'}</h2>
            <div className="form-group">
                <label htmlFor="name">Name:</label>
                <input
                    type="text"
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                />
                {errors.name && <p className="error">{errors.name}</p>}
            </div>
            <div className="form-group">
                <label htmlFor="authors">Authors:</label>
                <input
                    type="text"
                    id="authors"
                    value={authors}
                    onChange={(e) => setAuthors(e.target.value)}
                    required
                />
                {errors.authors && <p className="error">{errors.authors}</p>}
            </div>
            <div className="form-group">
                <label htmlFor="title">Title:</label>
                <input
                    type="text"
                    id="title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                />
            </div>
            <div className="form-group">
                <label htmlFor="info">Info (markup):</label>
                <AutoGrowTextarea
                    id="info"
                    value={info}
                    onChange={(e) => setInfo(e.target.value)}
                    rows={3}
                    style={{ resize: 'vertical', verticalAlign: 'top', overflow: 'hidden' }}
                />
            </div>
            <div className="form-actions">
                <button type="submit">Save</button>
                <button type="button" onClick={handleCancel}>Clear</button>
            </div>
            {apiError && <p className="error">{apiError}</p>}
        </form>
    );
}

export default SourceForm;
