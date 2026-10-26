import { useState, useEffect } from 'react';
import axios from 'axios';
import config from '../config';

interface Temperature {
    id?: number;
    meat: string;
    temp: number;
    description: string;
}

function TemperatureForm() {
    const [temperatures, setTemperatures] = useState<Temperature[]>([]);
    const [newTemperature, setNewTemperature] = useState<Temperature>({ meat: '', temp: 0.0, description: '' });

    useEffect(() => {
        fetchTemperatures();
    }, []);

    const fetchTemperatures = async () => {
        try {
            const response = await axios.get(`${config.backendUrl}/api/temperatures`);
            // Sort temperatures by meat (case-insensitive)
            const sortedTemperatures = response.data.sort((a: Temperature, b: Temperature) =>
                a.meat.localeCompare(b.meat, undefined, { sensitivity: 'base' })
            );
            setTemperatures(sortedTemperatures);
        } catch (error) {
            console.error('Error fetching temperatures:', error);
        }
    };

    const handleInputChange = (index: number, field: keyof Temperature, value: string | number) => {
        const updatedTemperatures = [...temperatures];
        updatedTemperatures[index][field] = value as never;
        setTemperatures(updatedTemperatures);
    };

    const handleDelete = async (index: number) => {
        const temperature = temperatures[index];
        if (temperature.id && window.confirm('Are you sure you want to delete this temperature?')) {
            try {
                await axios.delete(`${config.backendUrl}/api/temperatures/${temperature.id}`);
                setTemperatures(temperatures.filter((_, i) => i !== index));
            } catch (error) {
                console.error('Error deleting temperature:', error);
            }
        }
    };

    const handleAddNewRow = () => {
        setTemperatures([...temperatures, { ...newTemperature }]);
        setNewTemperature({ meat: '', temp: 0.0, description: '' });
    };

    const handleBlur = async (index: number) => {
        const temperature = temperatures[index];
        try {
            if (temperature.id) {
                await axios.put(`${config.backendUrl}/api/temperatures/${temperature.id}`, temperature);
            } else {
                const response = await axios.post(`${config.backendUrl}/api/temperatures`, temperature);
                temperatures[index] = response.data; // Update with the saved temperature (including ID)
            }
            // Sort temperatures by meat after saving
            const sortedTemperatures = [...temperatures].sort((a, b) =>
                a.meat.localeCompare(b.meat, undefined, { sensitivity: 'base' })
            );
            setTemperatures(sortedTemperatures);
        } catch (error) {
            console.error('Error saving temperature:', error);
        }
    };

    return (
        <div>
            <table>
                <thead>
                    <tr>
                        <th>Meat</th>
                        <th>Temperature</th>
                        <th>Description</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {temperatures.map((temperature, index) => (
                        <tr key={index}>
                            <td>
                                <input
                                    type="text"
                                    value={temperature.meat}
                                    onChange={(e) => handleInputChange(index, 'meat', e.target.value)}
                                    onBlur={() => handleBlur(index)}
                                />
                            </td>
                            <td>
                                <input
                                    type="number"
                                    value={temperature.temp}
                                    onChange={(e) => handleInputChange(index, 'temp', parseFloat(e.target.value))}
                                    onBlur={() => handleBlur(index)}
                                />
                            </td>
                            <td>
                                <input
                                    type="text"
                                    value={temperature.description}
                                    onChange={(e) => handleInputChange(index, 'description', e.target.value)}
                                    onBlur={() => handleBlur(index)}
                                />
                            </td>
                            <td>
                                <button onClick={() => handleBlur(index)} title="Save">
                                    <i className="fas fa-save"></i>
                                </button>
                                <button onClick={() => handleDelete(index)} title="Delete" className="btn-danger">
                                    <i className="fas fa-remove"></i>
                                </button>
                            </td>
                        </tr>
                    ))}
                    <tr>
                        <td>
                            <input
                                type="text"
                                value={newTemperature.meat}
                                onChange={(e) => setNewTemperature({ ...newTemperature, meat: e.target.value })}
                                placeholder="New meat"
                            />
                        </td>
                        <td>
                            <input
                                type="number"
                                value={newTemperature.temp}
                                onChange={(e) => setNewTemperature({ ...newTemperature, temp: parseFloat(e.target.value) })}
                                placeholder="New temperature"
                            />
                        </td>
                        <td>
                            <input
                                type="text"
                                value={newTemperature.description}
                                onChange={(e) => setNewTemperature({ ...newTemperature, description: e.target.value })}
                                placeholder="New description"
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

export default TemperatureForm;
