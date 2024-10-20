import React, { useRef, useEffect, useState } from 'react';
import { ReactSketchCanvas } from "react-sketch-canvas";

const WritingCanvas = ({ onRecognize, onClear }) => {
    const canvasRef = useRef();
    const [isHanziLookupLoaded, setIsHanziLookupLoaded] = useState(false);
    const [userStrokes, setUserStrokes] = useState([]);

    useEffect(() => {
        const script = document.createElement('script');
        script.src = '/hanzilookup.min.js';
        script.onload = () => {
            setIsHanziLookupLoaded(true);
            window.HanziLookup.init("mmah", "/mmah.json", (success) => {
                if (!success) console.error('Failed to load HanziLookup data file');
            });
        };
        script.onerror = () => console.error('Failed to load HanziLookup script');
        document.body.appendChild(script);

        return () => document.body.removeChild(script);
    }, []);

    const handleSaveAndRecognize = async () => {
        const strokes = await canvasRef.current.exportPaths();
        if (Array.isArray(strokes) && strokes.length > 0) {
            setUserStrokes(strokes);
            onRecognize(strokes[0].character, strokes); // 传递笔画数据
        } else {
            console.log('No stroke data');
        }
    };

    const clearCanvas = () => {
        canvasRef.current.clearCanvas();
        setUserStrokes([]); // 清空用户笔画
        if (onClear) onClear();
    };

    return (
        <div>
            <div id="canvas-container" style={{ border: "2px solid #ccc", padding: "10px", height: '400px', width: '600px' }}>
                <ReactSketchCanvas
                    ref={canvasRef}
                    style={{ border: "1px solid #000", height: "100%", width: "100%" }}
                    strokeWidth={4}
                    strokeColor="black"
                />
            </div>
            <button onClick={handleSaveAndRecognize} disabled={!isHanziLookupLoaded} style={{ marginTop: "10px" }}>
                {isHanziLookupLoaded ? 'Save and Recognize' : 'Loading...'}
            </button>
            <button onClick={clearCanvas} style={{ marginTop: "10px", marginLeft: "10px" }}>
                Clear Canvas
            </button>
        </div>
    );
};

export default WritingCanvas;
