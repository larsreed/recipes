import { useEffect } from 'react';
import SourceForm from './SourceForm';

interface SourceModalProps {
    onClose: () => void;
}

const SourceModal = ({ onClose }: SourceModalProps) => {
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
                <SourceForm />
            </div>
        </div>
    );
};

export default SourceModal;
