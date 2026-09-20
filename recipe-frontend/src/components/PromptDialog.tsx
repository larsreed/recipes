import React from 'react';

interface PromptDialogProps {
    message: string;
    onConfirm: () => void;
    onCancel: () => void;
}

const PromptDialog: React.FC<PromptDialogProps> = ({ message, onConfirm, onCancel }) => {
    const lines = message.split('\n');

    return (
        <div className="prompt-dialog">
            <div className="prompt-dialog-content">
                <p>
                    {lines.map((line, index) => (
                        <React.Fragment key={`${line}-${index}`}>
                            {line}
                            {index < lines.length - 1 && <br />}
                        </React.Fragment>
                    ))}
                </p>
                <button onClick={onConfirm}>Yes</button>
                <button onClick={onCancel}>No</button>
            </div>
        </div>
    );
};

export default PromptDialog;
