import axios from 'axios';

export default async function handler(req, res) {
    const { video_id, batch_id, subject_id, topic_id } = req.query;

    if (!video_id) {
        return res.status(400).json({ error: "Missing Parameters" });
    }

    try {
        const targetApi = `https://api.penpencil.co/v3/videos/get-video-details/${video_id}`; 
        
        const response = await axios.get(targetApi, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                'Authorization': 'Bearer APNA_REAL_LONG_BEARER_TOKEN_YAHAN_DALO',
                'client-type': 'WEB'
            }
        });

        res.status(200).json({
            manifestUrl: response.data.data?.videoUrl || response.data.stream_url,
            keyId: response.data.data?.key_id || "",
            keyValue: response.data.data?.key_value || ""
        });

    } catch (error) {
        res.status(500).json({ error: "Tunnel Fetch Failed", details: error.message });
    }
}
