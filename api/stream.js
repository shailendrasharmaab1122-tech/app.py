export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    const { url, video_id, batch_id } = req.query;

    // --- 1. TABS AND LECTURES DATA FETCH ---
    if (url) {
        try {
            const response = await fetch(url, {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                    'Accept': 'application/json, text/plain, */*',
                    'Origin': 'https://eduvibe-pw-api.wasmer.app',
                    'Referer': 'https://eduvibe-pw-api.wasmer.app/'
                }
            });

            if (!response.ok) throw new Error();
            const data = await response.json();
            return res.status(200).json(data);
        } catch (error) {
            return res.status(500).json({ error: "Failed to fetch channel index" });
        }
    }

    // --- 2. VIDEO STREAM DECRYPTION TUNNEL ---
    if (!video_id) {
        return res.status(400).json({ error: "Missing parameters" });
    }

    const bId = batch_id || "321850";

    // METHOD A: EDUVIBE API TUNNEL (HIGH PRIORITY BYPASS)
    try {
        const eduVibeApi = `https://eduvibe-pw-api.wasmer.app/get-lectures.php?batch_id=${bId}&video_id=${video_id}&tab=videos`;
        const vResponse = await fetch(eduVibeApi, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                'Accept': 'application/json'
            }
        });
        
        if (vResponse.ok) {
            const vData = await vResponse.json();
            // Finding the exact lecture match for dynamic token keys
            const lecture = vData.lectures?.find(l => l?.videoDetails?._id === video_id || l?._id === video_id);
            
            if (lecture && lecture.videoDetails?.manifestUrl) {
                return res.status(200).json({
                    success: true,
                    manifestUrl: lecture.videoDetails.manifestUrl,
                    keyId: lecture.videoDetails.keyId || "",
                    keyValue: lecture.videoDetails.keyValue || "",
                    source: "EduVibe-Tunnel-V3"
                });
            }
        }
    } catch (err) {}

    // METHOD B: DELTA STUDY SCRAPER FALLBACK
    try {
        const targetUrl = `https://deltastudy.site/study-v2/batches/${bId}?video_id=${video_id}`;
        const response = await fetch(targetUrl, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36',
                'Accept': 'text/html'
            }
        });

        if (response.ok) {
            const html = await response.text();
            const manifestUrl = html.match(/["'](https:\/\/sec-prod-mediacdn\.pw\.live\/[^"']+\.(?:mpd|m3u8)[^"']*)["']/)?.[1];
            const keyId = html.match(/["']keyId["']\s*:\s*["']([^"']+)["']/)?.[1] || html.match(/["']key_id["']\s*:\s*["']([^"']+)["']/)?.[1];
            const keyValue = html.match(/["']keyValue["']\s*:\s*["']([^"']+)["']/)?.[1] || html.match(/["']key_value["']\s*:\s*["']([^"']+)["']/)?.[1];

            if (manifestUrl && keyId && keyValue) {
                return res.status(200).json({
                    success: true,
                    manifestUrl: manifestUrl,
                    keyId: keyId,
                    keyValue: keyValue,
                    source: "Delta-Scraper-V2"
                });
            }
        }
    } catch (error) {}

    // METHOD C: LAST RESORT RAW LINK
    return res.status(200).json({
        success: true,
        manifestUrl: `https://sec-prod-mediacdn.pw.live/files/${video_id}/master.mpd`,
        keyId: "auto-sync",
        keyValue: "auto-sync",
        source: "Raw-Unsigned-Fallback"
    });
}
