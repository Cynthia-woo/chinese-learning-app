import HanziLookup from 'hanzi-lookup-js'; // Import the library

// Initialize the HanziLookup with data
HanziLookup.init('mmah', 'path/to/mmah.json', (loaded) => {
    if (!loaded) {
        console.error('Failed to load MMAH data');
    }
});

export const recognizeCharacter = async (strokes) => {
    const analyzedChar = new HanziLookup.AnalyzedCharacter(strokes); // Pass strokes
    const matcher = new HanziLookup.Matcher('mmah'); // Use MMAH data for matching

    return new Promise((resolve, reject) => {
        matcher.match(analyzedChar, 8, (matches) => {
            if (matches.length > 0) {
                resolve(matches[0].character); // Return the best match
            } else {
                resolve('No match found');
            }
        });
    });
};