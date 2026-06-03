export default async function handler(req, res) {
    const { batch_id, subject_id, topic_id, tab } = req.query;

    const targetUrl = `https://eduvibe-pw-api.wasmer.app/get-lectures.php?batch_id=${encodeURIComponent(batch_id)}&subject_id=${encodeURIComponent(subject_id)}&topic_id=${encodeURIComponent(topic_id)}&tab=${encodeURIComponent(tab)}`;

    try {
        const response = await fetch(targetUrl);
        const data = await response.json();
        
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Content-Type', 'application/json');
        res.status(200).json(data);
    } catch (error) {
        res.status(500).json({ error: "Proxy Failed" });
    }
}
