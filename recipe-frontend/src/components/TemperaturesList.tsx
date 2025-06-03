import { useState, useEffect } from 'react';
import axios from 'axios';
import TemperatureForm from './TemperatureForm';
import config from '../config';

interface Temperature {
    id: number;
    meat: string;
    temp: number;
}

function TemperaturesList() {
    const [temperatures, setTemperatures] = useState<Temperature[]>([]);
    const [editingTemperature, setEditingTemperature] = useState<Temperature | null>(null);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    const fetchTemperatures = () => {
        axios.get(`${config.backendUrl}/api/temperatures`)
            .then(response => {
                setTemperatures(response.data);
                setErrorMessage(null); // Clear errors on success
            })
            .catch(error => {
                setErrorMessage('Error fetching temperatures.');
                console.error('Error fetching temperatures:', error);
            });
    };

    useEffect(() => {
        fetchTemperatures();
    }, []);

    const deleteTemperature = async (id: number) => {
        if (window.confirm('Are you sure you want to delete this temperature?')) {
            try {
                await axios.delete(`${config.backendUrl}/api/temperatures/${id}`);
                setTemperatures(temperatures.filter(temperature => temperature.id !== id));
                setErrorMessage(null); // Clear errors on success
            } catch (error) {
                setErrorMessage('Error deleting temperature.');
                console.error('Error deleting temperature:', error);
            }
        }
    };


    const saveTemperature = async (temperature: Temperature) => {
        try {
            await axios.put(`${config.backendUrl}/api/temperatures/${temperature.id}`, temperature);
            setEditingTemperature(null);
            fetchTemperatures();
            setErrorMessage(null); // Clear errors on success
        } catch (error) {
            setErrorMessage('Error saving temperature.');
            console.error('Error saving temperature:', error);
        }
    };

    return (
        <div>
            <h2>Temperature List</h2>
            {errorMessage && <p className="error">{errorMessage}</p>}
            <table>
                <thead>
                <tr>
                    <th>ID</th>
                    <th>Temperature (C)</th>
                    <th>Meat</th>
                    <th/>
                </tr>
                </thead>
                <tbody>
                {temperatures.map(temperature => (
                    <tr key={temperature.id}>
                        <td>{temperature.id}</td>
                        <td>{temperature.temp}</td>
                        <td>{temperature.meat}</td>
                        <td>
                            <button onClick={() => setEditingTemperature(temperature)} title="Edit">
                                <i className="fas fa-edit"></i>
                            </button>
                            &nbsp;
                            <button onClick={() => deleteTemperature(temperature.id)} title="Delete">
                                <i className="fas fa-remove"></i>
                            </button>
                        </td>
                    </tr>
                ))}
                </tbody>
            </table>
            <hr/>
            {editingTemperature ? (
                <TemperatureForm
                    temperature={editingTemperature}
                    onSave={saveTemperature}
                    onCancel={() => setEditingTemperature(null)}
                    onTemperatureCreated={fetchTemperatures}
                />
            ) : (
                <TemperatureForm
                    onSave={(temperature) => saveTemperature(temperature)}
                    onCancel={() => setEditingTemperature(null)}
                    onTemperatureCreated={fetchTemperatures}
                />
            )}
        </div>
    );
}

export default TemperaturesList;
