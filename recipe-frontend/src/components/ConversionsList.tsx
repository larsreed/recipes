import { useState, useEffect } from 'react';
import axios from 'axios';
import ConversionForm from './ConversionForm';
import config from '../config';

interface Conversion {
    id: number;
    fromMeasure: string;
    toMeasure: string;
    factor: number;
}

function ConversionsList() {
    const [conversions, setConversions] = useState<Conversion[]>([]);
    const [editingConversion, setEditingConversion] = useState<Conversion | null>(null);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    const fetchConversions = () => {
        axios.get(`${config.backendUrl}/api/conversions`)
            .then(response => {
                setConversions(response.data);
                setErrorMessage(null); // Clear errors on success
            })
            .catch(error => {
                    setErrorMessage('Error fetching conversions.');
                    console.error('Error fetching conversions:', error);
                }
            );
    };

    useEffect(() => {
        fetchConversions();
    }, []);

    const deleteConversion = async (id: number) => {
        if (window.confirm('Are you sure you want to delete this conversion?')) {
            try {
                await axios.delete(`${config.backendUrl}/api/conversions/${id}`);
                setConversions(conversions.filter(conversion => conversion.id !== id));
                setErrorMessage(null); // Clear errors on success
            } catch (error) {
                console.error('Error deleting conversion:', error);
                setErrorMessage('Error deleting conversion.');
            }
        }
    };


    const saveConversion = async (conversion: Conversion) => {
        try {
            await axios.put(`${config.backendUrl}/api/conversions/${conversion.id}`, conversion);
            setEditingConversion(null);
            fetchConversions();
            setErrorMessage(null); // Clear errors on success
        } catch (error) {
            console.error('Error deleting conversion:', error);
            setErrorMessage('Error saving conversion.');
        }
    };

    return (
        <div>
            <h2>Conversion List</h2>
            {errorMessage && <p className="error">{errorMessage}</p>}
            <table>
                <thead>
                <tr>
                    <th>ID</th>
                    <th>From</th>
                    <th>To</th>
                    <th>Factor</th>
                    <th/>
                </tr>
                </thead>
                <tbody>
                {conversions.map(conversion => (
                    <tr key={conversion.id}>
                        <td>{conversion.id}</td>
                        <td>{conversion.fromMeasure}</td>
                        <td>{conversion.toMeasure}</td>
                        <td>{conversion.factor}</td>
                        <td>
                            <button onClick={() => setEditingConversion(conversion)} title="Edit">
                                <i className="fas fa-edit"></i>
                            </button>
                            &nbsp;
                            <button onClick={() => deleteConversion(conversion.id)} title="Delete">
                                <i className="fas fa-remove"></i>
                            </button>
                        </td>
                    </tr>
                ))}
                </tbody>
            </table>
            <hr/>
            {editingConversion ? (
                <ConversionForm
                    conversion={editingConversion}
                    onSave={saveConversion}
                    onCancel={() => setEditingConversion(null)}
                    onConversionCreated={fetchConversions}
                />
            ) : (
                <ConversionForm
                    onSave={(conversion: Conversion) => saveConversion(conversion)}
                    onCancel={() => setEditingConversion(null)}
                    onConversionCreated={fetchConversions}
                />
            )}
        </div>
    );
}

export default ConversionsList;
