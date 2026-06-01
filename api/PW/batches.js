export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Content-Type', 'application/json; charset=utf-8');

    if (req.method === 'OPTIONS') return res.status(200).end();

    const urlParts = req.url.split('/');
    const batchId = urlParts[4];
    const subjectId = urlParts[6];
    const pathType = urlParts[urlParts.length - 1].split('?')[0];

    try {
        const baseUrl = "https://streamworld.vercel.app/api";
        const query = new URLSearchParams(req.query).toString();
        let targetUrl = "";

        if (pathType === 'details') {
            targetUrl = `${baseUrl}/batch/${batchId}/details`;
        } else if (pathType === 'topics') {
            targetUrl = `${baseUrl}/batch/${batchId}/subject/${subjectId}/topics?${query}`;
        } else if (pathType === 'contents') {
            targetUrl = `${baseUrl}/batch/${batchId}/subject/${subjectId}/contents?${query}`;
        } else {
            return res.status(404).json({ success: false, error: "Invalid path" });
        }

        const response = await fetch(targetUrl, {
            headers: {
                'Referer': 'https://physicswallah.live/',
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
            }
        });

        const data = await response.json();
        return res.status(response.status).json(data);

    } catch (error) {
        return res.status(500).json({ success: false, error: "Gateway Error" });
    }
}
