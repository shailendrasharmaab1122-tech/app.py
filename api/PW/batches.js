export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Content-Type', 'application/json; charset=utf-8');

    if (req.method === 'OPTIONS') return res.status(200).end();

    // URL को साफ करें और पाथ निकालें
    const cleanUrl = req.url.split('?')[0]; 
    const urlParts = cleanUrl.split('/').filter(Boolean); 
    // अब urlParts में सिर्फ काम के शब्द होंगे: ['api', 'proxy', 'batch', 'ID', 'details'...]

    const batchId = urlParts[3]; 
    const pathType = urlParts[urlParts.length - 1]; 
    const query = new URLSearchParams(req.query).toString();

    try {
        const baseUrl = "https://streamworld.vercel.app/api";
        let targetUrl = "";

        if (pathType === 'details') {
            targetUrl = `${baseUrl}/batch/${batchId}/details`;
        } 
        else if (pathType === 'topics' || pathType === 'contents') {
            // यहाँ subjectId को इंडेक्स 5 पर ढूंढ रहे हैं
            const subjectId = urlParts[5];
            targetUrl = `${baseUrl}/batch/${batchId}/subject/${subjectId}/${pathType}?${query}`;
        } 
        else {
            return res.status(404).json({ 
                success: false, 
                error: "Invalid path", 
                debug: { urlParts, pathType } // ये आपको बताएगा कि कोड क्या पढ़ रहा है
            });
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
