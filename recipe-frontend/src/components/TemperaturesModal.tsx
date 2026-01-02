import { useEffect } from 'react';
import TemperatureForm from './TemperatureForm';

// @ts-ignore
const TemperatureModal = ({onClose: onClose}) => {
    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                onClose();
            }
        };

        document.addEventListener('keydown', handleKeyDown);
        return () => {
            document.removeEventListener('keydown', handleKeyDown);
        };
    }, [onClose]);

    return (
        <div className="modal">
            <div className="modal-content">
                <span className="close" onClick={onClose}>&times;</span>
                <TemperatureForm />
            </div>
        </div>
    );
};

export default TemperatureModal;
