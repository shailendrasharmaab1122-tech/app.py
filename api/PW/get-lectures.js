// api/PW/get-lectures.js
export default async function handler(req, res) {
    const { batch_id, subject_id, topic_id, tab } = req.query;
    const url = `https://eduvibe-pw-api.wasmer.app/get-lectures.php?batch_id=${batch_id}&subject_id=${subject_id}&topic_id=${topic_id}&tab=${tab}`;
    
    try {
        const response = await fetch(url);
        const data = await response.json();
        res.status(200).json(data);
    } catch (error) {
        res.status(500).json({ error: "Failed to fetch" });
    }
}
