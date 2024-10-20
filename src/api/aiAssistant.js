export const aiRespond = async (input) => {
    try {
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${process.env.REACT_APP_OPENAI_API_KEY}` // Make sure the API key is set
            },
            body: JSON.stringify({
                model: 'gpt-3.5-turbo',
                messages: [
                    {
                        role: 'system',
                        content: `You are a Chinese learning assistant that specializes in helping CFL (Chinese Foreign Learners) improve their Chinese language skills.
            Your job is to assist students with Chinese character learning, including providing pinyin, pronunciation, and meanings. 
            When the student asks, "How do you write the character [X]?" respond with ONLY the pinyin and pronunciation of the specific character. 
            If the student asks for the meaning or any other question, provide a simple explanation of the character in English, including related words or common usages if possible. 
            Keep your answers short and focused on the student's needs. Always provide pinyin, pronunciation, and meanings in a clear, simple way.`
                    },
                    {
                        role: 'user',
                        content: input
                    }
                ]
            })
        });

        // Check response status
        if (!response.ok) {
            throw new Error(`API request failed with status ${response.status}`);
        }

        const data = await response.json();

        // Safely check if choices are available
        if (data.choices && data.choices.length > 0) {
            return data.choices[0].message.content; // Return the generated AI content
        } else {
            throw new Error('Invalid API response: No choices available');
        }

    } catch (error) {
        console.error('Error during API call:', error);
        return 'Sorry, something went wrong with the AI response.';
    }
};