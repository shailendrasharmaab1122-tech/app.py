export default async function handler(req, res) {
    const { batch_id } = req.query;
    
    // CORS aur Iframe Permission Headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET');
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');

    if (!batch_id) {
        return res.status(400).json({ error: "Required batch identity parameter missing." });
    }

    try {
        // Aapka exact bina 's' wala domain clean redirect ke sath
        return res.redirect(302, `https://eduvibe-pw.page.gd/batches/?batch_id=${batch_id}`);
    } catch (error) {
        return res.status(500).json({ error: "Failed to route traffic." });
    }
}
