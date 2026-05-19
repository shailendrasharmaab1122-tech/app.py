export default async function handler(req, res) {
    // 1. CORS Headers set karo taaki local ya kisi bhi frontend se loading block na ho
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    res.setHeader('Content-Type', 'application/json; charset=utf-8');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    // 2. Query parameters nikal lo (type aur batch_id)
    const { type, batch_id } = req.query;

    if (!batch_id) {
        return res.status(400).json({ success: false, error: "Missing required parameter: batch_id" });
    }

    try {
        let targetUrl = "";

        // Frontend se type=batch aa raha hai
        if (type === 'batch') {
            // FIX: Exact target URL string, bina kisi automatic string append ke jhanjhat ke
            targetUrl = `https://eduvibe-pw-api.wasmer.app/batch.php?batch_id=${encodeURIComponent(batch_id)}`;
        } else {
            // Agar koi aur type pass ho toh safe fallback
            targetUrl = `https://eduvibe-pw-api.wasmer.app/batch.php?batch_id=${encodeURIComponent(batch_id)}`;
        }

        // 3. Core Server se fresh data fetch karo
        const response = await fetch(targetUrl, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                'Accept': 'application/json'
            }
        });

        if (!response.ok) {
            return res.status(response.status).json({ success: false, error: "Core server responded with error" });
        }

        const data = await response.json();
        
        // 4. Response wapas client ko bhej do
        return res.status(200).json(data);

    } catch (error) {
        console.error("Backend Proxy Error:", error);
        return res.status(500).json({ success: false, error: "Failed to tunnel secure connection" });
    }
}
