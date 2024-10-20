const path = require('path');

module.exports = {
    webpack: {
        configure: {
            resolve: {
                fallback: {
                    "buffer": require.resolve("buffer/"),
                    "http": require.resolve("stream-http"),
                    "https": require.resolve("https-browserify"),
                    "url": require.resolve("url/"),
                },
            },
        },
    },
};