export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    const { url, video_id, batch_id, subjectSlug, topicSlug } = req.query;

    if (url) {
        // ... (आपका पुराना कोड)
    }

    if (!video_id) {
        return res.status(400).json({ error: "Missing core parameter: video_id" });
    }

    const bId = batch_id || "698ad3519549b300a5e1cc6a"; 

    if (subjectSlug && topicSlug) {
        try {
            // यहाँ encodeURIComponent का इस्तेमाल करें
            const deltaDataServer = `https://apiserver.deltastudy.site/api/pw/datacontent?batchId=${bId}&subjectSlug=${encodeURIComponent(subjectSlug)}&topicSlug=${encodeURIComponent(topicSlug)}&contentType=videos`;

            const dResponse = await fetch(deltaDataServer, {
                headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' }
            });

            if (dResponse.ok) {
                const responseData = await dResponse.json();
                const videosList = responseData.data || responseData;
                const matchVideo = videosList.find(v => v.videoDetails?._id === video_id || v._id === video_id);

                if (matchVideo && matchVideo.videoDetails?.manifestUrl) {
                    return res.status(200).json({
                        success: true,
                        manifestUrl: matchVideo.videoDetails.manifestUrl,
                        keyId: matchVideo.videoDetails.keyId || "",
                        keyValue: matchVideo.videoDetails.keyValue || "",
                        source: "Delta-Internal-API"
                    });
                }
            }
        } catch (err) {}
    }

    // ... (EduVibe वाला पार्ट)

    // यहाँ बदलाव करें: auto-sync की जगह खाली स्ट्रिंग
    return res.status(200).json({
        success: true,
        manifestUrl: `https://sec-prod-mediacdn.pw.live/files/${video_id}/master.mpd`,
        keyId: "",
        keyValue: "",
        source: "Unsigned-Raw-Tunnel"
    });
}
