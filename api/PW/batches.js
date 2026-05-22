export default async function handler(req, res) {
    // 1. CORS & Response Headers configuration
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    res.setHeader('Content-Type', 'application/json; charset=utf-8');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    // 2. Destructure all query parameters from frontend request
    const { type, batch_id, subject_id, topic_id, tab } = req.query;

    if (!batch_id) {
        return res.status(400).json({ success: false, error: "Missing required parameter: batch_id" });
    }

    try {
        let targetUrl = "";

        // Dynamic routing system based on type parameter
        if (type === 'chapters') {
            if (!subject_id) {
                return res.status(400).json({ success: false, error: "Missing subject_id for chapters fetch" });
            }
            targetUrl = `https://eduvibe-pw-api.wasmer.app/chapters.php?batch_id=${encodeURIComponent(batch_id)}&subject_id=${encodeURIComponent(subject_id)}`;
        } 
        else if (type === 'lectures') {
            const activeTab = tab || 'videos';
            targetUrl = `https://eduvibe-pw-api.wasmer.app/get-lectures.php?batch_id=${encodeURIComponent(batch_id)}&subject_id=${encodeURIComponent(subject_id)}&topic_id=${encodeURIComponent(topic_id)}&tab=${encodeURIComponent(activeTab)}`;
        } 
        else {
            targetUrl = `https://eduvibe-pw-api.wasmer.app/batch.php?batch_id=${encodeURIComponent(batch_id)}`;
        }

        // Fetch data from secure upstream core cluster
        const response = await fetch(targetUrl, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Accept': 'application/json'
            }
        });

        if (!response.ok) {
            return res.status(response.status).json({ success: false, error: "Core production cluster returned flat response error" });
        }

        const rawData = await response.json();

        // 3. CORE RE-MAPPING ENGINE: Intercept batch catalog structure layout
        if (!type || type === 'batch') {
            let actualData = rawData.data || rawData;

            let rawSubjects = [];
            if (Array.isArray(actualData)) {
                rawSubjects = actualData;
            } else {
                rawSubjects = actualData.subjects || actualData.batch_subjects || actualData.faculties || [];
            }

            // Clean, normalize and pipeline every single subject block
            let standardizedSubjects = rawSubjects.map(sub => {
                if (!sub) return null;
                
                // Track deep nested subject identity object inside Eduvibe layers
                let nestedSub = sub.subjectId && typeof sub.subjectId === 'object' ? sub.subjectId : {};
                
                // Title extraction
                let title = sub.batch_subject_name || sub.name || sub.subject || nestedSub.name || nestedSub.subject || "Premium Content Module";
                
                // Exact Video/Lecture Count Extraction (Fixes the 0 Lectures Bug)
                let lecturesCount = sub.lectureCount || sub.lectures || nestedSub.videos_count || nestedSub.content_count || sub.totalLectures || 0;
                
                // Exact Teacher Name Extraction (Fixes the Faculty Team placeholder bug)
                let teacherName = "Faculty Team";
                if (sub.teacherName || sub.teacher_name) {
                    teacherName = sub.teacherName || sub.teacher_name;
                } else if (nestedSub.faculties && nestedSub.faculties.length > 0) {
                    let fac = nestedSub.faculties[0];
                    teacherName = typeof fac === 'object' ? (fac.name || fac.displayName || "Faculty Team") : fac;
                } else if (sub.faculties && sub.faculties.length > 0) {
                    let fac = sub.faculties[0];
                    teacherName = typeof fac === 'object' ? (fac.name || fac.displayName || "Faculty Team") : fac;
                }

                // Image Extraction
                let image = "https://static.pw.live/react-batches/assets/svg/subjects/defaultSubject.svg";
                if (nestedSub.imageId?.baseUrl && nestedSub.imageId?.key) {
                    image = nestedSub.imageId.baseUrl + nestedSub.imageId.key;
                } else if (sub.previewImage || sub.thumbnail || nestedSub.previewImage || nestedSub.thumbnail) {
                    image = sub.previewImage || sub.thumbnail || nestedSub.previewImage || nestedSub.thumbnail;
                }

                // Return a flat optimized JSON blueprint straight to Client-Side
                return {
                    _id: sub._id || sub.id || nestedSub._id || nestedSub.id,
                    name: title,
                    subject: title,
                    lectureCount: lecturesCount,
                    teacherName: teacherName,
                    image: image,
                    slug: sub.slug || nestedSub.slug || ""
                };
            }).filter(Boolean);

            let classes = actualData.classes || actualData.live_classes || [];
            let batchTitle = rawData.batch_title || actualData.batch_title || actualData.name || "The DevCoderZ Dashboard";

            return res.status(200).json({
                success: true,
                batch_title: batchTitle,
                subjects: standardizedSubjects,
                classes: classes
            });
        }

        // Pass clean objects directly for chapters and lectures execution types
        return res.status(200).json(rawData);

    } catch (error) {
        console.error("Secure Serverless Gateway Error:", error);
        return res.status(500).json({ success: false, error: "Failed to securely tunnel stream schema mapping" });
    }
}
