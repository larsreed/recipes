import { useState, useEffect } from 'react';
import axios from 'axios';
import SourceForm from './SourceForm';

interface Source {
    id: number;
    name: string;
    authors: string;
}

function SourceList() {
    const [sources, setSources] = useState<Source[]>([]);

    const fetchSources = () => {
        axios.get('http://localhost:8080/api/sources')
            .then(response => {
                setSources(response.data);
            })
            .catch(error => console.error('Error fetching sources:', error));
    };

    useEffect(() => {
        fetchSources();
    }, []);

    const deleteSource = async (id: number) => {
        if (window.confirm('Are you sure you want to delete this source?')) {
            try {
                // Nullify references in recipes
                await axios.put(`http://localhost:8080/api/recipes/nullify-source/${id}`);
                // Delete the source
                await axios.delete(`http://localhost:8080/api/sources/${id}`);
                setSources(sources.filter(source => source.id !== id));
            } catch (error) {
                console.error('Error deleting source:', error);
            }
        }
    };

    return (
        <div>
            <h2>Source List</h2>
            <table>
                <thead>
                <tr>
                    <th>ID</th>
                    <th>Name</th>
                    <th>Authors</th>
                    <th>Actions</th>
                </tr>
                </thead>
                <tbody>
                {sources.map(source => (
                    <tr key={source.id}>
                        <td>{source.id}</td>
                        <td>{source.name}</td>
                        <td>{source.authors}</td>
                        <td>
                            <button onClick={() => deleteSource(source.id)}>DELETE</button>
                        </td>
                    </tr>
                ))}
                </tbody>
            </table>
            <hr/>
            <SourceForm onSourceCreated={fetchSources}/>
        </div>
    );
}

export default SourceList;
