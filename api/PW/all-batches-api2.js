export default async function handler(req, res) {
    const { batch_id } = req.query;

    // CORS aur Security Headers Setup
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    res.setHeader('Content-Type', 'application/json; charset=utf-8');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (!batch_id) {
        return res.status(400).json({ error: "Required batch identity parameter missing." });
    }

    try {
        // Naye solid wasmer endpoints par dynamic mapping fetch call
        const response = await fetch(`https://eduvibe-pw-api.wasmer.app`, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
            }
        });

        if (!response.ok) throw new Error("Wasmer cluster response failed");

        const data = await response.json();
        return res.status(200).json(data);
        
    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: "Failed to fetch stream data securely from core network." });
    }
}
