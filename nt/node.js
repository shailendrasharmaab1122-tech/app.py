// /api/nt-data.js ya node.js (Vercel functions ke liye)
const express = require('express');
const axios = require('axios');
const cheerio = require('cheerio');
const cors = require('cors');

const app = express();
app.use(cors());

// Scraper Engine Endpoint
app.get('/api/get-nt-data', async (req, res) => {
    try {
        // Next Toppers ki live site se HTML fetch karna
        const response = await axios.get('https://www.nexttoppers.com/', {
            headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' }
        });
        
        const $ = cheerio.load(response.data);
        const fetchedData = {
            banners: [],
            courses: [],
            achievements: {}
        };

        // 1. Extracting Banners
        $('.banner_wrapper img').each((i, el) => {
            const imgUrl = $(el).attr('src');
            if (imgUrl) fetchedData.banners.push(imgUrl);
        });

        // 2. Extracting Products / Batches
        $('.tranding_course_explore img').each((i, el) => {
            const imgUrl = $(el).attr('src');
            const title = $(el).attr('alt') || `Batch ${i+1}`;
            fetchedData.courses.push({ title, imgUrl });
        });

        // 3. Static fallback achievements agar dynamic na milein
        fetchedData.achievements = {
            instructors: "20+",
            videos: "20K+",
            students: "20L+",
            tests: "200+"
        };

        res.json({ success: true, data: fetchedData });

    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

module.exports = app;
