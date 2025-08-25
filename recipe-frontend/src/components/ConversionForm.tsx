import React, { useState, useEffect } from 'react';
import axios from 'axios';
import config from '../config';
import measureOptions from './measureOptions';


interface Conversion {
    id: number;
    fromMeasure: string;
    toMeasure: string;
    factor: number;
}

interface ConversionFormProps {
    conversion?: Conversion;
    onCancel: () => void;
    onConversionCreated?: () => void;
    onSave?: () => void;
}

function ConversionForm({ conversion, onCancel, onConversionCreated }: ConversionFormProps) {
    const [fromMeasure, setFromMeasure] = useState(conversion?.fromMeasure || '');
    const [toMeasure, setToMeasure] = useState(conversion?.toMeasure || '');
    const [factor, setFactor] = useState(conversion?.factor || 0.0);

    useEffect(() => {
        if (conversion) {
            setFromMeasure(conversion.fromMeasure);
            setToMeasure(conversion.toMeasure);
            setFactor(conversion.factor);
        } else {
            setFromMeasure('');
            setToMeasure('');
            setFactor(0.0);
        }
    }, [conversion]);

    const [errors, setErrors] = useState<{ [key: string]: string }>({});
    const [apiError, setApiError] = useState<string | null>(null);

    const validate = () => {
        const newErrors: { [key: string]: string } = {};
        if (!fromMeasure) newErrors.fromMeasure = 'From is required';
        if (!toMeasure) newErrors.toMeasure = 'To is required';
        if (!factor) newErrors.factor = 'Factor is required';
        return newErrors;
    };

    const handleSubmit = async (event: React.FormEvent) => {
        event.preventDefault();
        const newErrors = validate();
        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            return;
        }
        const newConversion = { ...conversion, fromMeasure, toMeasure, factor };
        console.log(newConversion); //FIXME
        const apiUrl = conversion ? `${config.backendUrl}/api/conversions/${conversion.id}` : `${config.backendUrl}/api/conversions`;
        try {
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            // @ts-ignore
            const response = conversion ? await axios.put(apiUrl, newConversion) : await axios.post(apiUrl, newConversion);
            setFromMeasure('');
            setToMeasure('');
            setFactor(0.0);
            setErrors({});
            setApiError(null);
            if (onConversionCreated) onConversionCreated();
        } catch (error) {
            console.error('Error saving conversion:', error);
            setApiError('Failed to save conversion. Please try again.');
        }
    };

    const handleCancel = () => {
        setFromMeasure('');
        setToMeasure('');
        setFactor(0.0);
        setErrors({});
        setApiError(null);
        onCancel();
    };

    // @ts-ignore
    // @ts-ignore
    return (
        <form onSubmit={handleSubmit} className="conversion-form">
            <h2>{conversion ? 'Edit conversion' : 'Add a new conversion'}</h2>
            <div className="form-line">

                <label>From:</label>
                <select
                    value={fromMeasure}
                    onChange={(e) => setFromMeasure(e.target.value)}>
                    {measureOptions.map(option => (
                        <option key={option} value={option}>{option}</option>
                    ))}
                </select>
                <label>To:</label>
                <select
                    value={toMeasure}
                    onChange={(e) => setToMeasure(e.target.value)} >
                    {measureOptions.map(option => (
                        <option key={option} value={option}>{option}</option>
                    ))}
                </select>
                <label htmlFor="factor">Factor:</label>
                <input
                    type="float"
                    id="factor"
                    value={factor}
                    onChange={(e) => {
                        // @ts-ignore
                        setFactor(e.target.value);
                    }}
                    required
                />

                {errors.fromMeasure && <p className="error">{errors.fromMeasure}</p>}
                {errors.toMeasure && <p className="error">{errors.toMeasure}</p>}
                {errors.factor && <p className="error">{errors.factor}</p>}
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

export default ConversionForm;
