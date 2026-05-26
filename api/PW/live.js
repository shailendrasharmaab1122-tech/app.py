const axios = require('axios');

module.exports = async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET');

    const { batch_id, subject_id, video_id, start } = req.query;

    if (!batch_id || !video_id) {
        return res.status(400).json({ error: "Missing parameters" });
    }

    const targetUrl = `https://eduvibe-pw-api.wasmer.app/live.php?batch_id=${batch_id}&subject_id=${subject_id}&video_id=${video_id}&start=${start || ''}`;

    try {
        const response = await axios.get(targetUrl, {
            headers: {
                'Accept': 'application/json',
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
            }
        });

        return res.status(200).json(response.data);
    } catch (error) {
        return res.status(500).json({ error: "Stream request failed", message: error.message });
    }
};
