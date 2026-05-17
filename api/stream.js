export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    const { video_id, batch_id, subject_id, topic_id } = req.query;

    if (!video_id) {
        return res.status(400).json({ error: "video_id toh dena hi padega bhai!" });
    }

    // Default parameters agar user link se miss ho jayein
    const bId = batch_id || "321850";
    const sId = subject_id || "";
    const tId = topic_id || "";

    // === Strategy 1: Eduvibe Secure Backup Channel ===
    try {
        const backupUrl = `https://eduvibe-pw.page.gd/videoplayerr.php?video_id=${video_id}&batch_id=${bId}&subject_id=${sId}&topic_id=${tId}`;
        
        const response = await fetch(backupUrl, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
            }
        });

        const htmlContent = await response.text();

        // Advanced flexible regex jo unke har badle hue variable format ko pakad lega
        const manifestUrl = htmlContent.match(/manifestUrl\s*=\s*["']([^"']+)["']/)?.[1];
        const keyId = htmlContent.match(/keyId\s*=\s*["']([^"']+)["']/)?.[1];
        const keyValue = htmlContent.match(/keyValue\s*=\s*["']([^"']+)["']/)?.[1];

        if (manifestUrl && keyId && keyValue) {
            return res.status(200).json({ manifestUrl, keyId, keyValue });
        }
    } catch (e) {
        console.log("Backup strategy failed, trying direct next layer...");
    }

    // === Strategy 2: Direct Penpencil Content API Fallback ===
    try {
        const directApiUrl = `https://api.penpencil.co/v1/videos/v2/${video_id}`;
        const directRes = await fetch(directApiUrl, {
            headers: {
                'Origin': 'https://www.pw.live',
                'Referer': 'https://www.pw.live/'
            }
        });
        const json = await directRes.json();

        if (json && json.data && json.data.videoLink) {
            return res.status(200).json({
                manifestUrl: json.data.videoLink,
                keyId: json.data.keyId || "",
                keyValue: json.data.keyValue || ""
            });
        }
    } catch (err) {}

    // Agar sab kuch fail ho jaye tabhi error dikhana hai
    return res.status(200).json({ 
        error: "Server sync issue. Ek baar link reload karke try karein bhai!" 
    });
}
