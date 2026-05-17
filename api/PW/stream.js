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

        let manifestUrl = htmlContent.match(/const manifestUrl\s*=\s*["']([^"']+)["']/)?.[1] || 
                          htmlContent.match(/manifestUrl\s*=\s*["']([^"']+)["']/)?.[1];
                          
        let keyId = htmlContent.match(/const keyId\s*=\s*["']([^"']+)["']/)?.[1] || 
                    htmlContent.match(/keyId\s*=\s*["']([^"']+)["']/)?.[1];
                    
        let keyValue = htmlContent.match(/const keyValue\s*=\s*["']([^"']+)["']/)?.[1] || 
                       htmlContent.match(/keyValue\s*=\s*["']([^"']+)["']/)?.[1];

        if (!manifestUrl && htmlContent.includes("initPlayer")) {
            const jsonParams = htmlContent.match(/initPlayer\(([^)]+)\)/)?.[1];
            if (jsonParams) {
                const parts = jsonParams.split(',').map(p => p.trim().replace(/['"]/g, ''));
                if (parts.length >= 3) {
                    manifestUrl = parts[0];
                    keyId = parts[1];
                    keyValue = parts[2];
                }
            }
        }

        if (!manifestUrl) {
            if (htmlContent.includes("Cookies are not enabled") || htmlContent.includes("Cloudflare")) {
                return res.status(500).json({ error: "Target protected by security wall. Handshake blocked." });
            }
            return res.status(500).json({ error: "Source format changed or stream expired." });
        }

        return res.status(200).json({ manifestUrl, keyId, keyValue });

    } catch (error) {
        return res.status(500).json({ error: "Backend handshake failed" });
    }
}
