export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    res.setHeader('Content-Type', 'application/json; charset=utf-8');

    if (req.method === 'OPTIONS') return res.status(200).end();

    const { type, batch_id, subject_id, chapter_id, topic_id, tab } = req.query;

    try {
        // 1. LECTURES
        if (type === 'lectures') {
            const targetTopicId = topic_id || chapter_id;
            const activeTab = tab || 'videos';
            const targetUrl = `https://eduvibe-pw-api.wasmer.app/get-lectures.php?batch_id=${encodeURIComponent(batch_id)}&subject_id=${encodeURIComponent(subject_id)}&topic_id=${encodeURIComponent(targetTopicId)}&tab=${encodeURIComponent(activeTab)}`;
            const response = await fetch(targetUrl, { headers: { 'User-Agent': 'Mozilla/5.0' } });
            return res.status(200).json(await response.json());
        }

        // 2. CHAPTERS
        if (type === 'chapters') {
            const targetUrl = `https://eduvibe-pw-api.wasmer.app/chapters.php?batch_id=${encodeURIComponent(batch_id)}&subject_id=${encodeURIComponent(subject_id)}`;
            const response = await fetch(targetUrl, { headers: { 'User-Agent': 'Mozilla/5.0' } });
            return res.status(200).json(await response.json());
        }

        // 3. BATCH
        if (type === 'batch' || (batch_id && !subject_id)) {
            const targetUrl = `https://eduvibe-pw-api.wasmer.app/batch.php?batch_id=${encodeURIComponent(batch_id)}`;
            const response = await fetch(targetUrl, { headers: { 'User-Agent': 'Mozilla/5.0' } });
            return res.status(200).json(await response.json());
        }

        return res.status(400).json({ error: "Invalid type parameter" });
    } catch (error) {
        return res.status(500).json({ error: "Failed to tunnel secure connection" });
    }
}
