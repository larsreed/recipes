import React from 'react';

interface PromptDialogProps {
    message: string;
    onConfirm: () => void;
    onCancel: () => void;
}

const PromptDialog: React.FC<PromptDialogProps> = ({ message, onConfirm, onCancel }) => {
    return (
        <div className="prompt-dialog">
            <div className="prompt-dialog-content">
                <p>{message}</p>
                <button onClick={onConfirm}>Yes</button>
                <button onClick={onCancel}>No</button>
            </div>
        </div>
    );
};

export default PromptDialog;
