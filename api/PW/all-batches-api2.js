export default async function handler(req, res) {
    const { batch_id } = req.query;
    
    if (!batch_id) {
        return res.status(400).json({ error: "Required batch identity parameter missing." });
    }

    try {
        
        return res.redirect(302, `https://eduvibe-pw.page.gd/batches/?batch_id=${batch_id}`);
    } catch (error) {
        return res.status(500).json({ error: "Failed to route traffic to structural destination." });
    }
}
