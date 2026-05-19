export default async function handler(req, res) {
    // 1. CORS Headers configuration
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    res.setHeader('Content-Type', 'application/json; charset=utf-8');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    // 2. Destructure all dynamic parameters coming from frontend
    const { type, batch_id, subject_id, topic_id, tab } = req.query;

    if (!batch_id) {
        return res.status(400).json({ success: false, error: "Missing required parameter: batch_id" });
    }

    try {
        let targetUrl = "";

        // Route 1: CHAPTERS CALL
        if (type === 'chapters') {
            if (!subject_id) {
                return res.status(400).json({ success: false, error: "Missing subject_id for chapters fetch" });
            }
            targetUrl = `https://eduvibe-pw-api.wasmer.app/chapters.php?batch_id=${encodeURIComponent(batch_id)}&subject_id=${encodeURIComponent(subject_id)}`;
        } 
        // Route 2: LECTURES CALL
        else if (type === 'lectures') {
            const activeTab = tab || 'videos';
            targetUrl = `https://eduvibe-pw-api.wasmer.app/get-lectures.php?batch_id=${encodeURIComponent(batch_id)}&subject_id=${encodeURIComponent(subject_id)}&topic_id=${encodeURIComponent(topic_id)}&tab=${encodeURIComponent(activeTab)}`;
        } 
        // Route 3: DEFAULT BATCH CATALOG CALL
        else {
            targetUrl = `https://eduvibe-pw-api.wasmer.app/batch.php?batch_id=${encodeURIComponent(batch_id)}`;
        }

        // 3. Connect safely to the secure terminal backend
        const response = await fetch(targetUrl, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                'Accept': 'application/json'
            }
        });

        if (!response.ok) {
            return res.status(response.status).json({ success: false, error: "Core production cluster returned flat response error" });
        }

        const data = await response.json();
        return res.status(200).json(data);

    } catch (error) {
        console.error("Secure Serverless Gateway Error:", error);
        return res.status(500).json({ success: false, error: "Failed to securely tunnel stream schema mapping" });
    }
}
