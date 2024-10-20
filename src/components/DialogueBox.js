// DialogueBox.js
import React from 'react';

const DialogueBox = ({ dialogue }) => {
    return (
        <div className="dialogue-box">
            {dialogue.map((line, index) => (
                <p key={index} className={line.speaker}>
                    <strong>{line.speaker === 'ai' ? 'AI' : 'User'}:</strong> {line.text}
                </p>
            ))}
        </div>
    );
};

export default DialogueBox;