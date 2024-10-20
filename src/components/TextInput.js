import React, { useState } from 'react';

const TextInput = ({ onSend, onVoiceInput }) => {
    const [input, setInput] = useState('');

    const handleSend = () => {
        if (input.trim()) {
            onSend(input);
            setInput('');
        }
    };

    return (
        <div>
            <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Type here..."
            />
            <button onClick={handleSend}>Send</button>
            <button onClick={onVoiceInput}>Use Voice</button>
        </div>
    );
};

export default TextInput;
