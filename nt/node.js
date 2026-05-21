const express = require('express');
const axios = require('axios');
const cors = require('cors');

const app = express();
app.use(cors());

// Core API Route
app.get('/api/get-nt-data', async (req, res) => {
    try {
        // Target Eduvibe JSON API
        const eduvibeApi = 'https://eduvibe-mj.pages.dev/allbatches.json';
        
        const response = await axios.get(eduvibeApi, {
            headers: { 
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' 
            }
        });

        const rawData = response.data;
        let finalCourses = [];
        let finalBanners = [];

        // Dynamic Mapping: Agar data direct array hai ya kisi object ke andar hai
        const batchList = Array.isArray(rawData) ? rawData : (rawData.batches || rawData.data || []);

        batchList.forEach((batch, index) => {
            // Bach ke key-names handle karne ke liye fallbacks
            const title = batch.name || batch.title || batch.batchName || `Batch ${index + 1}`;
            const imgUrl = batch.image || batch.banner || batch.thumbnail || 'https://via.placeholder.com/300x169/1e293b/fff?text=No+Image';
            const streamUrl = batch.link || batch.stream || batch.url || '#';

            finalCourses.push({ title, imgUrl, streamUrl });

            // Agar data mein alag se banners hain toh save karo, nahi toh pehle batch ko banner bana lo
            if (batch.isBanner || batch.featured) {
                finalBanners.push(imgUrl);
            }
        });

        // Fallback: Agar koi specific banner nahi mila, toh pehle batch ki image use kar lo
        if (finalBanners.length === 0 && finalCourses.length > 0) {
            finalBanners.push(finalCourses[0].imgUrl);
        }

        res.json({
            success: true,
            data: {
                banners: finalBanners,
                courses: finalCourses
            }
        });

    } catch (error) {
        res.status(500).json({ 
            success: false, 
            message: "Pipeline Error: " + error.message 
        });
    }
});

module.exports = app;
