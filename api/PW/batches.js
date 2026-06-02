import { NextResponse } from 'next/server';

const BASE_URL = 'https://eduvibe-pw-api.wasmer.app';

export async function GET(request) {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json; charset=utf-8',
  };

  try {
    const { searchParams } = new URL(request.url);
    
    const type = searchParams.get('type');
    const batch_id = searchParams.get('batch_id');
    const subject_id = searchParams.get('subject_id');
    const topic_id = searchParams.get('topic_id');
    const tab = searchParams.get('tab') || 'videos';

    if (!batch_id) {
      return NextResponse.json({ success: false, error: "batch_id is required" }, { status: 400, headers });
    }

    let targetUrl = '';

    if (type === 'chapters') {
      if (!subject_id) {
        return NextResponse.json({ success: false, error: "subject_id required for chapters" }, { status: 400, headers });
      }
      targetUrl = `\( {BASE_URL}/chapters.php?batch_id= \){encodeURIComponent(batch_id)}&subject_id=${encodeURIComponent(subject_id)}`;
    } 
    else if (type === 'lectures') {
      if (!subject_id || !topic_id) {
        return NextResponse.json({ success: false, error: "subject_id and topic_id required for lectures" }, { status: 400, headers });
      }
      targetUrl = `\( {BASE_URL}/get-lectures.php?batch_id= \){encodeURIComponent(batch_id)}&subject_id=\( {encodeURIComponent(subject_id)}&topic_id= \){encodeURIComponent(topic_id)}&tab=${encodeURIComponent(tab)}`;
    } 
    else {
      // Default Batch
      targetUrl = `\( {BASE_URL}/batch.php?batch_id= \){encodeURIComponent(batch_id)}`;
    }

    const response = await fetch(targetUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0',
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      return NextResponse.json({ 
        success: false, 
        error: `Upstream error: ${response.status}` 
      }, { status: response.status, headers });
    }

    const rawData = await response.json();

    // ==================== BATCH TRANSFORMATION ====================
    if (!type || type === 'batch') {
      try {
        let actualData = rawData.data || rawData || {};

        let rawSubjects = Array.isArray(actualData) 
          ? actualData 
          : (actualData.subjects || actualData.batch_subjects || actualData.faculties || []);

        const standardizedSubjects = rawSubjects
          .map(sub => {
            if (!sub) return null;

            const nestedSub = (sub.subjectId && typeof sub.subjectId === 'object') ? sub.subjectId : {};

            const title = sub.batch_subject_name || sub.name || sub.subject || 
                         nestedSub.name || nestedSub.subject || "Premium Content Module";

            const lecturesCount = sub.lectureCount || sub.lectures || 
                                nestedSub.videos_count || nestedSub.content_count || 
                                sub.totalLectures || 0;

            let teacherName = "Faculty Team";
            if (sub.teacherName || sub.teacher_name) {
              teacherName = sub.teacherName || sub.teacher_name;
            } else if (nestedSub.faculties?.length > 0) {
              const fac = nestedSub.faculties[0];
              teacherName = (typeof fac === 'object' ? fac.name || fac.displayName : fac) || "Faculty Team";
            } else if (sub.faculties?.length > 0) {
              const fac = sub.faculties[0];
              teacherName = (typeof fac === 'object' ? fac.name || fac.displayName : fac) || "Faculty Team";
            }

            let image = "https://static.pw.live/react-batches/assets/svg/subjects/defaultSubject.svg";
            if (nestedSub.imageId?.baseUrl && nestedSub.imageId?.key) {
              image = nestedSub.imageId.baseUrl + nestedSub.imageId.key;
            } else if (sub.previewImage || sub.thumbnail || nestedSub.previewImage || nestedSub.thumbnail) {
              image = sub.previewImage || sub.thumbnail || nestedSub.previewImage || nestedSub.thumbnail;
            }

            return {
              _id: sub._id || sub.id || nestedSub._id || nestedSub.id || "",
              name: title,
              subject: title,
              lectureCount: Number(lecturesCount),
              teacherName,
              image,
              slug: sub.slug || nestedSub.slug || ""
            };
          })
          .filter(Boolean);

        const batchTitle = rawData.batch_title || actualData.batch_title || actualData.name || "DevCoderZ Batch";

        return NextResponse.json({
          success: true,
          batch_title: batchTitle,
          subjects: standardizedSubjects,
          classes: actualData.classes || actualData.live_classes || []
        }, { headers });

      } catch (transformError) {
        console.error("Transformation Error:", transformError);
        return NextResponse.json({ 
          success: false, 
          error: "Data transformation failed",
          raw: rawData 
        }, { status: 500, headers });
      }
    }

    // Chapters & Lectures - direct return
    return NextResponse.json(rawData, { headers });

  } catch (error) {
    console.error("Server Error:", error);
    return NextResponse.json({ 
      success: false, 
      error: "Internal Server Error",
      message: error.message 
    }, { status: 500, headers });
  }
}