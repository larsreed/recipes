import React, { useRef, useEffect } from "react";

interface AutoGrowTextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
    value: string;
}

const AutoGrowTextarea: React.FC<AutoGrowTextareaProps> = ({ value, ...props }) => {
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    useEffect(() => {
        const textarea = textareaRef.current;
        if (textarea) {
            textarea.style.height = "auto";
            textarea.style.height = textarea.scrollHeight + "px";
        }
    }, [value]);

    return (
        <textarea
            ref={textareaRef}
            value={value}
            {...props}
            style={{ resize: "vertical", verticalAlign: "top", overflow: "hidden", ...props.style }}
        />
    );
};

export default AutoGrowTextarea;