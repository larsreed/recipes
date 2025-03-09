import { useState, useEffect } from 'react';
import axios from 'axios';
import SourceForm from './SourceForm.tsx';

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
                console.log('Fetched sources:', response.data);
                setSources(response.data);
            })
            .catch(error => console.error('Error fetching sources:', error));
    };

    useEffect(() => {
        fetchSources();
    }, []);

    return (
        <div>
            <h2>Source List</h2>
            <table>
                <thead>
                <tr>
                    <th>ID</th>
                    <th>Name</th>
                    <th>Authors</th>
                </tr>
                </thead>
                <tbody>
                {sources.map(source => (
                    <tr key={source.id}>
                        <td>{source.id}</td>
                        <td>{source.name}</td>
                        <td>{source.authors}</td>
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
