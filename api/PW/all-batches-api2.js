export default async function handler(req, res) {
    const { batch_id } = req.query;

    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Content-Type', 'text/html');

    if (!batch_id) {
        return res.status(400).json({ error: "Required batch identity parameter missing." });
    }

    try {
        // Redirect karne ki jagah, hum peeche se us site ka content khud utha rahe hain
        const response = await fetch(`https://eduvibe-pw.page.gd/batches/?batch_id=${batch_id}`);
        let html = await response.text();

        // Agar usne koi strict script lagayi ho toh use safe karne ke liye ya content direct deliver karne ke liye:
        return res.status(200).send(html);
    } catch (error) {
        return res.status(500).json({ error: "Failed to fetch stream data securely." });
    }
}
