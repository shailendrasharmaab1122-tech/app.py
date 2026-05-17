export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    const { video_id, batch_id, subject_id, topic_id } = req.query;

    if (!video_id || !batch_id) {
        return res.status(400).json({ error: "Parameters missing" });
    }

    try {
        const targetUrl = `https://eduvibe-pw.page.gd/videoplayerr.php?video_id=${video_id}&batch_id=${batch_id}&subject_id=${subject_id}&topic_id=${topic_id}`;
        
        const response = await fetch(targetUrl, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
                'Accept-Language': 'en-US,en;q=0.5'
            }
        });

        const htmlContent = await response.text();

        const manifestUrl = htmlContent.match(/manifestUrl\s*=\s*["']([^"']+)["']/)?.[1];
        const keyId = htmlContent.match(/keyId\s*=\s*["']([^"']+)["']/)?.[1];
        const keyValue = htmlContent.match(/keyValue\s*=\s*["']([^"']+)["']/)?.[1];

        if (!manifestUrl || !keyId || !keyValue) {
            return res.status(200).json({ 
                error: "Source format changed", 
                debug_html: htmlContent.substring(0, 1000) 
            });
        }

        return res.status(200).json({ manifestUrl, keyId, keyValue });

    } catch (error) {
        return res.status(500).json({ error: "Backend handshake failed" });
    }
}
