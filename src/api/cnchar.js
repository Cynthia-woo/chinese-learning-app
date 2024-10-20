import cnchar from 'cnchar';
import 'cnchar-draw'; // Ensure cnchar-draw is imported

export const drawStrokeOrder = (char, setCurrentStroke) => {
    if (cnchar.isCnChar(char)) {
        cnchar.draw(char, {
            el: document.getElementById('canvas-container'), // Element where the character is drawn
            type: 'animation', // Use 'animation' directly instead of TYPE.ANIMATION
            clear: true, // Clear previous drawing
            animation: {
                autoAnimate: true, // Automatically start the animation
                stepByStep: true, // Enable step-by-step drawing
                loopAnimate: true, // Loop the animation
                strokeAnimationSpeed: 1, // Animation speed
                delayBetweenStrokes: 300, // Delay between strokes
                drawNextStroke: (currentStrokeIndex) => {
                    setCurrentStroke(currentStrokeIndex + 1); // Update current stroke
                }
            },
            style: {
                strokeColor: '#000', // Stroke color
                showOutline: true, // Show outline
                length: 60 // Size of the character
            }
        });
    } else {
        console.error('Input is not a valid Chinese character.');
    }
};