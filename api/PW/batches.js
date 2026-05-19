export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    res.setHeader('Content-Type', 'application/json; charset=utf-8');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    const { type, batch_id, subject_id, chapter_id, topic_id, tab } = req.query;

    try {
        // 1. LECTURES LOGIC
        if (type === 'lectures') {
            const targetTopicId = topic_id || chapter_id;
            const activeTab = tab || 'videos';
            if (!batch_id || !subject_id || !targetTopicId) {
                return res.status(400).json({ error: "Missing identity parameters for lectures" });
            }
            const targetUrl = `https://eduvibe-pw-api.wasmer.app/get-lectures.php?batch_id=${encodeURIComponent(batch_id)}&subject_id=${encodeURIComponent(subject_id)}&topic_id=${encodeURIComponent(targetTopicId)}&tab=${encodeURIComponent(activeTab)}`;
            const response = await fetch(targetUrl, { headers: { 'User-Agent': 'Mozilla/5.0' } });
            if (!response.ok) throw new Error("Lectures fetch failed");
            const data = await response.json();
            return res.status(200).json(data);
        }

        // 2. CHAPTERS LOGIC
        if (type === 'chapters') {
            if (!batch_id || !subject_id) {
                return res.status(400).json({ error: "Missing batch_id or subject_id" });
            }
            const targetUrl = `https://eduvibe-pw-api.wasmer.app/chapters.php?batch_id=${encodeURIComponent(batch_id)}&subject_id=${encodeURIComponent(subject_id)}`;
            const response = await fetch(targetUrl, { headers: { 'User-Agent': 'Mozilla/5.0' } });
            if (!response.ok) throw new Error("Chapters fetch failed");
            const data = await response.json();
            return res.status(200).json(data);
        }

        // 3. BATCH LOGIC (Default Fallback agar type na bheja ho tab bhi)
        if (type === 'batch' || (batch_id && !subject_id)) {
            if (!batch_id) {
                return res.status(400).json({ error: "Missing batch_id" });
            }
            const targetUrl = `https://eduvibe-pw-api.wasmer.app/batch.php?batch_id=${encodeURIComponent(batch_id)}`;
            const response = await fetch(targetUrl, { headers: { 'User-Agent': 'Mozilla/5.0' } });
            if (!response.ok) throw new Error("Batch fetch failed");
            const data = await response.json();
            return res.status(200).json(data);
        }

        return res.status(400).json({ error: "Invalid request configuration matrix" });

    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: "Secure core network synchronization failure." });
    }
}
