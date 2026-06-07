import { useEffect } from 'react';
import ConversionForm from './ConversionForm';

interface ConversionModalProps {
    onClose: () => void;
}

const ConversionModal = ({ onClose }: ConversionModalProps) => {
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
                <ConversionForm />
            </div>
        </div>
    );
};

export default ConversionModal;
