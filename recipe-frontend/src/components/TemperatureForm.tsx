import React, { useState, useEffect } from 'react';
import axios from 'axios';
import config from '../config';

interface Temperature {
    id: number;
    meat: string;
    temp: number;
}

interface TemperatureFormProps {
    temperature?: Temperature;
    onCancel: () => void;
    onTemperatureCreated?: () => void;
    onSave?: (temperature: Temperature) => Promise<void>;
}

function TemperatureForm({ temperature, onCancel, onTemperatureCreated }: TemperatureFormProps) {
    const [meat, setMeat] = useState(temperature?.meat || '');
    const [temp, setTemp] = useState(temperature?.temp || 0.0);

    useEffect(() => {
        if (temperature) {
            setTemp(temperature.temp);
            setMeat(temperature.meat);
        } else {
            setMeat('');
            setTemp(0.0);
        }
    }, [temperature]);

    const [errors, setErrors] = useState<{ [key: string]: string }>({});
    const [apiError, setApiError] = useState<string | null>(null);

    const validate = () => {
        const newErrors: { [key: string]: string } = {};
        if (!temp) newErrors.temp = 'Temperature is required';
        if (!meat) newErrors.meat = 'Meat is required';
        return newErrors;
    };

    const handleSubmit = async (event: React.FormEvent) => {
        event.preventDefault();
        const newErrors = validate();
        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            return;
        }
        const newTemperature = { ...temperature, meat, temp };
        console.log(newTemperature); //FIXME
        const apiUrl = temperature ? `${config.backendUrl}/api/temperatures/${temperature.id}` : `${config.backendUrl}/api/temperatures`;
        try {
            // @ts-ignore
            const response = temperature ? await axios.put(apiUrl, newTemperature) : await axios.post(apiUrl, newTemperature);
            setMeat('');
            setTemp(0.0);
            setErrors({});
            setApiError(null);
            if (onTemperatureCreated) onTemperatureCreated();
        } catch (error) {
            console.error('Error saving temperature:', error);
            setApiError('Failed to save temperature. Please try again.');
        }
    };

    const handleCancel = () => {
        setMeat('');
        setTemp(0.0);
        setErrors({});
        setApiError(null);
        onCancel();
    };

    return (
        <form onSubmit={handleSubmit} className="Temperature-form">
            <h2>{temperature ? 'Edit Temperature' : 'Add a new Temperature'}</h2>
            <div className="form-line">

                <label htmlFor="temp">Temperature:</label>
                <input
                    type="float"
                    id="temp"
                    value={temp}
                    onChange={(e) => {
                        // @ts-ignore
                        setTemp(e.target.value);
                    }}
                    required
                />
                <label htmlFor="meat">Meat:</label>
                <input
                    type="text"
                    id="meat"
                    value={meat}
                    onChange={(e) => setMeat(e.target.value)}
                    required
                />

                {errors.temp && <p className="error">{errors.temp}</p>}
                {errors.meat && <p className="error">{errors.meat}</p>}
            </div>
            <div><p>&nbsp;</p></div>
            <div className="form-actions">
                <button type="submit">Save</button>
                <button type="button" onClick={handleCancel}>Clear</button>
            </div>
            {apiError && <p className="error">{apiError}</p>}
        </form>
    );
}

export default TemperatureForm;
