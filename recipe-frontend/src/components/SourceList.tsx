import { useState, useEffect } from 'react';
import axios from 'axios';
import SourceForm from './SourceForm';
import config from '../config';

interface Source {
    id: number;
    name: string;
    authors: string;
}

function SourceList() {
    const [sources, setSources] = useState<Source[]>([]);
    const [editingSource, setEditingSource] = useState<Source | null>(null);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    const fetchSources = () => {
        axios.get(`${config.backendUrl}/api/sources`)
            .then(response => {
                setSources(response.data);
                setErrorMessage(null); // Clear errors on success
            })
            .catch(error => setErrorMessage('Error fetching sources.'));
    };

    useEffect(() => {
        fetchSources();
    }, []);

    const deleteSource = async (id: number) => {
        if (window.confirm('Are you sure you want to delete this source?')) {
            try {
                await axios.put(`${config.backendUrl}/api/recipes/nullify-source/${id}`);
                await axios.delete(`${config.backendUrl}/api/sources/${id}`);
                setSources(sources.filter(source => source.id !== id));
                setErrorMessage(null); // Clear errors on success
            } catch (error) {
                setErrorMessage('Error deleting source.');
            }
        }
    };


    const saveSource = async (source: Source) => {
        try {
            await axios.put(`${config.backendUrl}/api/sources/${source.id}`, source);
            setEditingSource(null);
            fetchSources();
            setErrorMessage(null); // Clear errors on success
        } catch (error) {
            setErrorMessage('Error saving source.');
        }
    };

    return (
        <div>
            <h2>Source List</h2>
            {errorMessage && <p className="error">{errorMessage}</p>}
            <table>
                <thead>
                <tr>
                    <th>ID</th>
                    <th>Name</th>
                    <th>Authors</th>
                    <th/>
                </tr>
                </thead>
                <tbody>
                {sources.map(source => (
                    <tr key={source.id}>
                        <td>{source.id}</td>
                        <td>{source.name}</td>
                        <td>{source.authors}</td>
                        <td>
                            <button onClick={() => setEditingSource(source)} title="Edit">
                                <i className="fas fa-edit"></i>
                            </button>
                            &nbsp;
                            <button onClick={() => deleteSource(source.id)} title="Delete">
                                <i className="fas fa-remove"></i>
                            </button>
                        </td>
                    </tr>
                ))}
                </tbody>
            </table>
            <hr/>
            {editingSource ? (
                <SourceForm
                    source={editingSource}
                    onSave={saveSource}
                    onCancel={() => setEditingSource(null)}
                    onSourceCreated={fetchSources}
                />
            ) : (
                <SourceForm
                    onSave={(source) => saveSource(source)}
                    onCancel={() => setEditingSource(null)}
                    onSourceCreated={fetchSources}
                />
            )}
        </div>
    );
}

export default SourceList;
