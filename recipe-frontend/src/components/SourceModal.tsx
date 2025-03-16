import SourceList from './SourceList';

const SourceModal = ({ onClose }) => {
    return (
        <div className="modal">
            <div className="modal-content">
                <span className="close" onClick={onClose}>&times; </span>
                <SourceList />
            </div>
        </div>
    );
};

export default SourceModal;
