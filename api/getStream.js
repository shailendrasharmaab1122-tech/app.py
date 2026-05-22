import axios from 'axios';

export default async function handler(req, res) {
    // 1. Frontend se video_id lena
    const { video_id } = req.query;

    if (!video_id) {
        return res.status(400).json({ error: "Missing Parameter: video_id required" });
    }

    // 2. Vercel ke Environment Variables se token uthana
    const authToken = process.env.PW_TOKEN;

    if (!authToken) {
        return res.status(500).json({ 
            error: "Configuration Missing", 
            details: "Please add 'PW_TOKEN' in your Vercel Project Environment Variables." 
        });
    }

    try {
        const targetApi = `https://api.penpencil.co/v3/videos/get-video-details/${video_id}`;
        // 3. Official API par request bhejra secure headers ke sath
        const response = await axios.get(targetApi, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Authorization': authToken.startsWith('Bearer ') ? authToken : `Bearer ${authToken}`,
                'client-type': 'WEB',
                'Accept': 'application/json'
            }
        });

        const videoData = response.data?.data;

        // 4. Response check karke frontend ko streaming URLs aur keys dena
        if (!videoData) {
            return res.status(404).json({ error: "Video details not found in API response" });
        }

        res.status(200).json({
            manifestUrl: videoData.videoUrl || videoData.stream_url || "",
            keyId: videoData.key_id || videoData.keyId || "",
            keyValue: videoData.key_value || videoData.keyValue || ""
        });

    } catch (error) {
        // 5. Token expire hone ya koi aur dikkat aane par error handling
        const statusCode = error.response ? error.response.status : 500;
        const errorMessage = error.response ? error.response.data?.message : error.message;

        res.status(statusCode).json({ 
            error: "Tunnel Fetch Failed", 
            status: statusCode,
            details: errorMessage 
        });
    }
}