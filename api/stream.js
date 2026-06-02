Export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    const { url, video_id, batch_id, subjectSlug, topicSlug } = req.query;

    if (url) {
        try {
            const response = await fetch(url, {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                    'Accept': 'application/json, text/plain, */*',
                    'Origin': 'https://DevCoderz.vercel.app/api/PW/batches.js/',
                    'Referer': 'https://DevCoderz.vercel.app/api/PW/batches.js/'
                }
            });

            if (!response.ok) throw new Error();
            const data = await response.json();
            return res.status(200).json(data);
        } catch (error) {
            return res.status(500).json({ error: "Failed to fetch structured layout" });
        }
    }

    if (!video_id) {
        return res.status(400).json({ error: "Missing core parameter: video_id" });
    }

    const bId = batch_id || "698ad3519549b300a5e1cc6a"; 

    if (subjectSlug && topicSlug) {
        try {
            const deltaDataServer = `https://apiserver.deltastudy.site/api/pw/datacontent?batchId=${bId}&subjectSlug=${subjectSlug}&topicSlug=${topicSlug}&contentType=videos`;

            const dResponse = await fetch(deltaDataServer, {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                    'Accept': 'application/json'
                }
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

    try {
        const eduVibeApi = `https://eduvibe-pw-api.wasmer.app/get-lectures.php?batch_id=${bId}&video_id=${video_id}&tab=videos`;
        const vResponse = await fetch(eduVibeApi, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                'Accept': 'application/json'
            }
        });

        if (vResponse.ok) {
            const vData = await vResponse.json();
            const lecture = vData.lectures?.find(l => l?.videoDetails?._id === video_id || l?._id === video_id);

            if (lecture && lecture.videoDetails?.manifestUrl) {
                return res.status(200).json({
                    success: true,
                    manifestUrl: lecture.videoDetails.manifestUrl,
                    keyId: lecture.videoDetails.keyId || "",
                    keyValue: lecture.videoDetails.keyValue || "",
                    source: "EduVibe-Tunnel-V3"
                });
            }
        }
    } catch (err) {}

    return res.status(200).json({
        success: true,
        manifestUrl: `https://sec-prod-mediacdn.pw.live/files/${video_id}/master.mpd`,
        keyId: "auto-sync",
        keyValue: "auto-sync",
        source: "Unsigned-Raw-Tunnel"
    });
}


