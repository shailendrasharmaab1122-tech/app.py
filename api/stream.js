export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    const { url, video_id, batch_id } = req.query;

    // =================================================================
    // CASE 1: AGAR FRONTEND SE LECTURE LIST KA URL AAYA HAI (Bypass Mode)
    // =================================================================
    if (url) {
        try {
            const response = await fetch(url, {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
                    'Accept': 'application/json, text/plain, */*',
                    'Origin': 'https://eduvibe-pw-api.wasmer.app',
                    'Referer': 'https://eduvibe-pw-api.wasmer.app/'
                }
            });

            if (!response.ok) throw new Error("Wasmer cluster rejected backend request");
            
            const data = await response.json();
            return res.status(200).json(data); // Seedhe pure json array response frontend ko pass kiya

        } catch (error) {
            console.error("Lecture List Proxy Mode Failed:", error);
            return res.status(500).json({ error: "Bhai, Wasmer backend fetch fail ho gaya proxy par!" });
        }
    }

    // =================================================================
    // CASE 2: AGAR VIDEO_ID AAYI HAI (Delta Scraping Mode for Player)
    // =================================================================
    if (!video_id) {
        return res.status(400).json({ error: "Bhai, url ya video_id me se kuch ek bhej na!" });
    }

    const bId = batch_id || "321850"; // Fallback NEET Batch ID

    try {
        const targetUrl = `https://deltastudy.site/study-v2/batches/${bId}?video_id=${video_id}`;

        const response = await fetch(targetUrl, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Mobile Safari/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
                'Accept-Language': 'en-US,en;q=0.5'
            }
        });

        const html = await response.text();

        // Regex thoda update kiya taaki quotes ya brackets ke beech ka clear raw link nikle
        const manifestUrl = html.match(/["'](https:\/\/sec-prod-mediacdn\.pw\.live\/[^"']+\.(?:mpd|m3u8)[^"']*)["']/)?.[1] || 
                            html.match(/["'](https:\/\/[^"']+\.(?:mpd|m3u8)\?[^"']*)["']/)?.[1];

        const keyId = html.match(/["']keyId["']\s*:\s*["']([^"']+)["']/)?.[1] || 
                      html.match(/["']key_id["']\s*:\s*["']([^"']+)["']/)?.[1];

        const keyValue = html.match(/["']keyValue["']\s*:\s*["']([^"']+)["']/)?.[1] || 
                        html.match(/["']key_value["']\s*:\s*["']([^"']+)["']/)?.[1];

        if (manifestUrl) {
            return res.status(200).json({
                success: true,
                manifestUrl: manifestUrl,
                keyId: keyId || "",
                keyValue: keyValue || "",
                source: "Delta-Scraper-V2"
            });
        }

    } catch (error) {
        console.error("Delta Main Scraper Layer Failed:", error);
    }

    // Ultimate Safe Fallback Channel for Video Player
    return res.status(200).json({
        success: true,
        manifestUrl: `https://sec-prod-mediacdn.pw.live/files/${video_id}/master.mpd`,
        keyId: "auto-sync",
        keyValue: "auto-sync",
        note: "Fallback active due to network restrictions."
    });
}
