const express = require('express');
const router = express.Router();
const https = require('https');

// @route   POST /api/translate
// @desc    Translate text using Google Translate API (GTX)
// @access  Public (or Private)
router.post('/', (req, res) => {
    const { text, targetLang } = req.body;

    if (!text || !targetLang) {
        return res.status(400).json({ message: 'Text and targetLang are required' });
    }

    const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=${targetLang}&dt=t&q=${encodeURIComponent(text)}`;

    https.get(url, (apiRes) => {
        let data = '';

        // A chunk of data has been received.
        apiRes.on('data', (chunk) => {
            data += chunk;
        });

        // The whole response has been received.
        apiRes.on('end', () => {
            try {
                // response is like [[["Translated Text","Source",...],...],...]
                const parsedData = JSON.parse(data);
                if (parsedData && parsedData[0]) {
                    // Combine segments
                    const translatedText = parsedData[0].map(segment => segment[0]).join('');
                    res.json({ translatedText });
                } else {
                    res.json({ translatedText: text }); // Fallback
                }
            } catch (e) {
                console.error('Translation Parse Error:', e);
                res.status(500).json({ message: 'Translation failed' });
            }
        });

    }).on("error", (err) => {
        console.error("Translation API Error: " + err.message);
        res.status(500).json({ message: 'Translation API error' });
    });
});

module.exports = router;
