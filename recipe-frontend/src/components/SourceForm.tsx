import { useState, useEffect } from 'react';
import axios from "axios";

interface Source {
    id: number;
    name: string;
    authors: string;
}

interface Attachment {
    id: number;
    fileName: string;
    fileType: string;
    data: string; // Base64 encoded
}

interface SourceFormProps {
    source?: Source;
    onCancel: () => void;
    onSourceCreated?: () => void;
    onSave?: () => void;
}

function SourceForm({ source, onCancel, onSourceCreated }: SourceFormProps) {
    const [name, setName] = useState(source?.name || '');
    const [authors, setAuthors] = useState(source?.authors || '');
    const [attachments, setAttachments] = useState<Attachment[]>([]);

    useEffect(() => {
        if (source) {
            setName(source.name);
            setAuthors(source.authors);
        } else {
            setName('');
            setAuthors('');
            setAttachments([]);
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
        const newSource = { ...source, name, authors, attachments };
        console.log('New source:', newSource);
        const apiUrl = source ? `http://localhost:8080/api/sources/${source.id}` : 'http://localhost:8080/api/sources';
        try {
            const response = source ? await axios.put(apiUrl, newSource) : await axios.post(apiUrl, newSource);
            console.log('Source saved:', response.data);
            setName('');
            setAuthors('');
            setAttachments([]);
            setErrors({});
            setApiError(null);
            if (onSourceCreated) onSourceCreated();
        } catch (error) {
            console.error('Error saving source:', error);
            setApiError('Failed to save source. Please try again.');
        }
    };

    return (
        <form onSubmit={handleSubmit}>
            <h2>{source ? 'Edit Source' : 'Add a New Source'}</h2>
            <div>
                <label>Name:</label>
                <input type="text" value={name} onChange={(e) => setName(e.target.value)}/>
                {errors.name && <p className="error">{errors.name}</p>}
            </div>
            <div>
                <label>Authors:</label>
                <input type="text" value={authors} onChange={(e) => setAuthors(e.target.value)}/>
                {errors.authors && <p className="error">{errors.authors}</p>}
            </div>
            <div>
                <label>Attachments:</label>
                <input type="file" onChange={handleAttachmentChange}/>
                <ul>
                    {attachments.map((attachment, index) => (
                        <li key={index}>
                            {attachment.fileName}
                            <button type="button" onClick={() => removeAttachment(index)}>Remove</button>
                        </li>
                    ))}
                </ul>
            </div>
            <div>
                <button type="submit">Save</button>
                <button type="button" onClick={onCancel}>Cancel</button>
            </div>
            {apiError && <p className="error">{apiError}</p>}
        </form>
    );
}

export default SourceForm;
