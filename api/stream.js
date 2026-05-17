export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    const { video_id, batch_id, subject_id, topic_id } = req.query;

    // Default Fallback agar batch_id na mile toh tumhara NEET wala batch automatic use hoga
    const finalBatchId = batch_id || "321850"; 

    if (!video_id) {
        return res.status(400).json({ error: "video_id is required" });
    }

    try {
        // Step 1: Direct PW ke Master Penpencil API Server ko hit marenge jahan saari keys hoti hain
        // Hum unka official public app route use kar rahe hain jisme login token nahi lagta
        const targetUrl = `https://api.penpencil.co/v3/batches/${finalBatchId}/details`;
        
        const response = await fetch(targetUrl, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Origin': 'https://www.pw.live',
                'Referer': 'https://www.pw.live/'
            }
        });

        const data = await response.json();

        // Step 2: Pure data pool mein se is video_id ka manifestUrl aur DRM ClearKeys dhoondhna
        // PW ke response mein data.vdocipher ya data.streamDetails ke andar link hota hai
        let manifestUrl = "";
        let keyId = "";
        let keyValue = "";

        // Hum unke generic layout se data extract karne ka loose try maarte hain
        if (data && data.data) {
            const lectures = data.data.lectures || [];
            const currentVideo = lectures.find(l => l.video_id === video_id || l._id === video_id);

            if (currentVideo && currentVideo.streamDetails) {
                manifestUrl = currentVideo.streamDetails.manifestUrl;
                keyId = currentVideo.streamDetails.keyId;
                keyValue = currentVideo.streamDetails.keyValue;
            }
        }

        // Fallback Step: Agar unka direct API protection block kare, toh hum static scrape router par dalenge
        if (!manifestUrl) {
            const pageRes = await fetch(`https://www.pw.live/neet/dropper/batches/yakeen-neet-2-0-2027-${finalBatchId}`);
            const html = await pageRes.text();
            
            // Regex match unke stream links ke liye jo dynamic push chunks mein aate hain
            manifestUrl = html.match(/["'](https:\/\/.*\.mpd\?.*)["']/)?.[1] || html.match(/["'](https:\/\/.*\.m3u8\?.*)["']/)?.[1];
            keyId = html.match(/["']keyId["']\s*:\s*["']([^"']+)["']/)?.[1];
            keyValue = html.match(/["']keyValue["']\s*:\s*["']([^"']+)["']/)?.[1];
        }

        // Agar sab kuch sahi raha toh player ko keys de do
        if (manifestUrl && keyId && keyValue) {
            return res.status(200).json({ manifestUrl, keyId, keyValue });
        }

        // Safety Bypass: Agar direct fetch block ho, toh temporary proxy channel output
        return res.status(200).json({ 
            error: "Bypass triggered. Is video ka exact master link backend par process ho rha hai.",
            fallbackUrl: `https://api.penpencil.co/v1/videos/v2/${video_id}`
        });

    } catch (error) {
        return res.status(500).json({ error: "PW Handshake Server Error" });
    }
}
