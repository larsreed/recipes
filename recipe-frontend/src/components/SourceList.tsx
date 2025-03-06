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
            <ul>
                {sources.map(source => (
                    <li key={source.id}>
                        <h3>{source.id}. {source.name}</h3>
                        <p>Authors: {source.authors}</p>
                    </li>
                ))}
            </ul>
            <hr/>
            <SourceForm onSourceCreated={fetchSources}/>
        </div>
    );
}

export default SourceList;
