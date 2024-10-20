// SpeechRecognitionComponent.js
import React, { useEffect } from 'react';

const SpeechRecognitionComponent = ({ onResult }) => {
    useEffect(() => {
        const recognition = new window.SpeechRecognition() || window.webkitSpeechRecognition();
        recognition.lang = 'en-US';
        recognition.interimResults = false;

        recognition.onresult = (event) => {
            const transcript = event.results[0][0].transcript;
            onResult(transcript);
        };

        recognition.onerror = (event) => {
            console.error('Speech recognition error:', event.error);
        };

        recognition.start();

        return () => {
            recognition.stop();
        };
    }, [onResult]);

    return null;
};

export default SpeechRecognitionComponent;
