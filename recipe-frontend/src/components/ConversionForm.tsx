import { useState, useEffect } from 'react';
import axios from 'axios';
import config from '../config';
import measureOptions from './measureOptions';

interface Conversion {
    id?: number;
    fromMeasure: string;
    toMeasure: string;
    factor: number;
    description: string;
}

function ConversionList() {
    const [conversions, setConversions] = useState<Conversion[]>([]);
    const [newConversion, setNewConversion] = useState<Conversion>({ fromMeasure: '', toMeasure: '', factor: 0, description: '' });

    useEffect(() => {
        fetchConversions();
    }, []);

    const fetchConversions = async () => {
        try {
            const response = await axios.get(`${config.backendUrl}/api/conversions`);
            setConversions(response.data);
        } catch (error) {
            console.error('Error fetching conversions:', error);
        }
    };

    const handleInputChange = (index: number, field: keyof Conversion, value: string | number) => {
        const updatedConversions = [...conversions];
        updatedConversions[index] = {
            ...updatedConversions[index],
            [field]: value,
        };
        setConversions(updatedConversions);
    };

    const handleSave = async (index: number) => {
        const conversion = conversions[index];
        try {
            if (conversion.id) {
                await axios.put(`${config.backendUrl}/api/conversions/${conversion.id}`, conversion);
            } else {
                const response = await axios.post(`${config.backendUrl}/api/conversions`, conversion);
                conversions[index] = response.data; // Update with the saved conversion (including ID)
            }
            setConversions([...conversions]);
        } catch (error) {
            console.error('Error saving conversion:', error);
        }
    };

    const handleDelete = async (index: number) => {
        const conversion = conversions[index];
        if (conversion.id && window.confirm('Are you sure you want to delete this conversion?')) {
            try {
                await axios.delete(`${config.backendUrl}/api/conversions/${conversion.id}`);
                setConversions(conversions.filter((_, i) => i !== index));
            } catch (error) {
                console.error('Error deleting conversion:', error);
            }
        }
    };

    const handleAddNewRow = async () => {
        try {
            const response = await axios.post(`${config.backendUrl}/api/conversions`, newConversion);
            setConversions([...conversions, response.data]);
            setNewConversion({ fromMeasure: '', toMeasure: '', factor: 0, description: '' });
        } catch (error) {
            console.error('Error adding new conversion:', error);
        }
    };

    return (
        <div>
            <table>
                <thead>
                    <tr>
                        <th>From</th>
                        <th>To</th>
                        <th>Factor</th>
                        <th>Description</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {conversions.map((conversion, index) => (
                        <tr key={index}>
                            <td>
                                <select
                                    value={conversion.fromMeasure}
                                    onChange={(e) => handleInputChange(index, 'fromMeasure', e.target.value)}
                                >
                                    {measureOptions.map(option => (
                                        <option key={option} value={option}>{option}</option>
                                    ))}
                                </select>
                            </td>
                            <td>
                                <select
                                    value={conversion.toMeasure}
                                    onChange={(e) => handleInputChange(index, 'toMeasure', e.target.value)}
                                >
                                    {measureOptions.map(option => (
                                        <option key={option} value={option}>{option}</option>
                                    ))}
                                </select>
                            </td>
                            <td>
                                <input
                                    type="number"
                                    value={conversion.factor}
                                    onChange={(e) => handleInputChange(index, 'factor', parseFloat(e.target.value))}
                                />
                            </td>
                            <td>
                                <input
                                    type="text"
                                    value={conversion.description}
                                    onChange={(e) => handleInputChange(index, 'description', e.target.value)}
                                />
                            </td>
                            <td>
                                <button onClick={() => handleSave(index)}>
                                    <i className="fas fa-save"></i>
                                </button>
                                <button onClick={() => handleDelete(index)} className="btn-danger">
                                    <i className="fas fa-remove"></i>
                                </button>
                            </td>
                        </tr>
                    ))}
                    <tr>
                        <td>
                            <select
                                value={newConversion.fromMeasure}
                                onChange={(e) => setNewConversion({ ...newConversion, fromMeasure: e.target.value })}
                            >
                                <option value="">Select</option>
                                {measureOptions.map(option => (
                                    <option key={option} value={option}>{option}</option>
                                ))}
                            </select>
                        </td>
                        <td>
                            <select
                                value={newConversion.toMeasure}
                                onChange={(e) => setNewConversion({ ...newConversion, toMeasure: e.target.value })}
                            >
                                <option value="">Select</option>
                                {measureOptions.map(option => (
                                    <option key={option} value={option}>{option}</option>
                                ))}
                            </select>
                        </td>
                        <td>
                            <input
                                type="number"
                                value={newConversion.factor}
                                onChange={(e) => setNewConversion({ ...newConversion, factor: parseFloat(e.target.value) })}
                            />
                        </td>
                        <td>
                            <input
                                type="text"
                                value={newConversion.description}
                                onChange={(e) => setNewConversion({ ...newConversion, description: e.target.value })}
                            />
                        </td>
                        <td>
                            <button onClick={handleAddNewRow}><i className="fas fa-add"></i></button>
                        </td>
                    </tr>
                </tbody>
            </table>
        </div>
    );
}

export default ConversionList;
