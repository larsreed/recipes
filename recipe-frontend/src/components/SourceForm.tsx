import React, { useState, useEffect } from 'react';
import axios from 'axios';
import config from '../config';

function SourceForm() {
    const [sources, setSources] = useState([]);
    const [newSource, setNewSource] = useState({ name: '', authors: '', info: '', title: '' });

    useEffect(() => {
        fetchSources();
    }, []);

    const fetchSources = async () => {
        try {
            const response = await axios.get(`${config.backendUrl}/api/sources`);
            setSources(response.data);
        } catch (error) {
            console.error('Error fetching sources:', error);
        }
    };

    const handleInputChange = (index, field, value) => {
        const updatedSources = [...sources];
        updatedSources[index][field] = value;
        setSources(updatedSources);
    };

    const handleSave = async (index) => {
        const source = sources[index];
        try {
            if (source.id) {
                await axios.put(`${config.backendUrl}/api/sources/${source.id}`, source);
            } else {
                const response = await axios.post(`${config.backendUrl}/api/sources`, source);
                sources[index] = response.data; // Update with the saved source (including ID)
            }
            setSources([...sources]);
        } catch (error) {
            console.error('Error saving source:', error);
        }
    };

    const handleDelete = async (index) => {
        const source = sources[index];
        if (source.id && window.confirm('Are you sure you want to delete this source?')) {
            try {
                await axios.delete(`${config.backendUrl}/api/sources/${source.id}`);
                setSources(sources.filter((_, i) => i !== index));
            } catch (error) {
                console.error('Error deleting source:', error);
            }
        }
    };

    const handleAddNewRow = () => {
        setSources([...sources, { ...newSource }]);
        setNewSource({ name: '', authors: '', info: '', title: '' });
    };

    const handleBlur = async (index) => {
        const source = sources[index];
        try {
            if (source.id) {
                await axios.put(`${config.backendUrl}/api/sources/${source.id}`, source);
            } else {
                const response = await axios.post(`${config.backendUrl}/api/sources`, source);
                sources[index] = response.data; // Update with the saved source (including ID)
            }
            setSources([...sources]);
        } catch (error) {
            console.error('Error saving source:', error);
        }
    };

    return (
        <div>
            <table>
                <thead>
                    <tr>
                        <th>ID</th>
                        <th>Name</th>
                        <th>Authors</th>
                        <th>Title</th>
                        <th>Info</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {sources.map((source, index) => (
                        <tr key={index}>
                            <td>{source.id || ''}</td>
                            <td>
                                <input
                                    type="text"
                                    value={source.name}
                                    onChange={(e) => handleInputChange(index, 'name', e.target.value)}
                                    onBlur={() => handleBlur(index)}
                                />
                            </td>
                            <td>
                                <input
                                    type="text"
                                    value={source.authors}
                                    onChange={(e) => handleInputChange(index, 'authors', e.target.value)}
                                    onBlur={() => handleBlur(index)}
                                />
                            </td>
                            <td>
                                <input
                                    type="text"
                                    value={source.title}
                                    onChange={(e) => handleInputChange(index, 'title', e.target.value)}
                                    onBlur={() => handleBlur(index)}
                                />
                            </td>
                            <td>
                                <input
                                    type="text"
                                    value={source.info}
                                    onChange={(e) => handleInputChange(index, 'info', e.target.value)}
                                    onBlur={() => handleBlur(index)}
                                />
                            </td>
                            <td>
                                <button onClick={() => handleSave(index)} title="Save">
                                    <i className="fas fa-save"></i>
                                </button>
                                <button onClick={() => handleDelete(index)} title="Delete" className="btn-danger">
                                    <i className="fas fa-remove"></i>
                                </button>
                            </td>
                        </tr>
                    ))}
                    <tr>
                        <td></td>
                        <td>
                            <input
                                type="text"
                                value={newSource.name}
                                onChange={(e) => setNewSource({ ...newSource, name: e.target.value })}
                                placeholder="New name"
                            />
                        </td>
                        <td>
                            <input
                                type="text"
                                value={newSource.authors}
                                onChange={(e) => setNewSource({ ...newSource, authors: e.target.value })}
                                placeholder="New authors"
                            />
                        </td>
                        <td>
                            <input
                                type="text"
                                value={newSource.title}
                                onChange={(e) => setNewSource({ ...newSource, title: e.target.value })}
                                placeholder="New title"
                            />
                        </td>
                        <td>
                            <input
                                type="text"
                                value={newSource.info}
                                onChange={(e) => setNewSource({ ...newSource, info: e.target.value })}
                                placeholder="New info"
                            />
                        </td>
                        <td>
                            <button onClick={handleAddNewRow}>
                                <i className="fas fa-add"></i>
                            </button>
                        </td>
                    </tr>
                </tbody>
            </table>
        </div>
    );
}

export default SourceForm;
