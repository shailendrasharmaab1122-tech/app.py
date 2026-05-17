export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    const { video_id, batch_id, subject_id, topic_id } = req.query;

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

        // Seedha HTML return karo taaki hum browser me dekh sakein kya aa raha hai
        res.setHeader('Content-Type', 'text/html');
        return res.status(200).send(htmlContent);

    } catch (error) {
        return res.status(500).json({ error: "Backend handshake failed" });
    }
}
