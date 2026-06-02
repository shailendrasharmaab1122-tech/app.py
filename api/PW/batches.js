import { NextResponse } from 'next/server';

const BASE_URL = 'https://eduvibe-pw-api.wasmer.app';

export async function GET(request) {
  // CORS headers
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
      return NextResponse.json(
        { success: false, error: "Missing required parameter: batch_id" },
        { status: 400, headers }
      );
    }

    let targetUrl = "";

    if (type === 'chapters') {
      if (!subject_id) {
        return NextResponse.json(
          { success: false, error: "Missing subject_id for chapters" },
          { status: 400, headers }
        );
      }
      targetUrl = `https://eduvibe-pw-api.wasmer.app/chapters.php?batch_id=\( {encodeURIComponent(batch_id)}&subject_id= \){encodeURIComponent(subject_id)}`;
    } 
    else if (type === 'lectures') {
      targetUrl = `https://eduvibe-pw-api.wasmer.app/get-lectures.php?batch_id=\( {encodeURIComponent(batch_id)}&subject_id= \){encodeURIComponent(subject_id)}&topic_id=\( {encodeURIComponent(topic_id)}&tab= \){encodeURIComponent(tab)}`;
    } 
    else {
      // Default: Batch
      targetUrl = `https://eduvibe-pw-api.wasmer.app/batch.php?batch_id=${encodeURIComponent(batch_id)}`;
    }

    const response = await fetch(targetUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      return NextResponse.json(
        { success: false, error: "Upstream API error" },
        { status: response.status, headers }
      );
    }

    const rawData = await response.json();

    // === BATCH DATA TRANSFORMATION (Tumhara main logic) ===
    if (!type || type === 'batch') {
      let actualData = rawData.data || rawData;

      let rawSubjects = [];
      if (Array.isArray(actualData)) {
        rawSubjects = actualData;
      } else {
        rawSubjects = actualData.subjects || actualData.batch_subjects || actualData.faculties || [];
      }

      const standardizedSubjects = rawSubjects.map(sub => {
        if (!sub) return null;

        let nestedSub = sub.subjectId && typeof sub.subjectId === 'object' ? sub.subjectId : {};

        let title = sub.batch_subject_name || sub.name || sub.subject || nestedSub.name || nestedSub.subject || "Premium Content Module";

        let lecturesCount = sub.lectureCount || sub.lectures || nestedSub.videos_count || nestedSub.content_count || sub.totalLectures || 0;

        let teacherName = "Faculty Team";
        if (sub.teacherName || sub.teacher_name) {
          teacherName = sub.teacherName || sub.teacher_name;
        } else if (nestedSub.faculties?.length > 0) {
          const fac = nestedSub.faculties[0];
          teacherName = typeof fac === 'object' ? (fac.name || fac.displayName || "Faculty Team") : fac;
        } else if (sub.faculties?.length > 0) {
          const fac = sub.faculties[0];
          teacherName = typeof fac === 'object' ? (fac.name || fac.displayName || "Faculty Team") : fac;
        }

        let image = "https://static.pw.live/react-batches/assets/svg/subjects/defaultSubject.svg";
        if (nestedSub.imageId?.baseUrl && nestedSub.imageId?.key) {
          image = nestedSub.imageId.baseUrl + nestedSub.imageId.key;
        } else if (sub.previewImage || sub.thumbnail || nestedSub.previewImage || nestedSub.thumbnail) {
          image = sub.previewImage || sub.thumbnail || nestedSub.previewImage || nestedSub.thumbnail;
        }

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

      const batchTitle = rawData.batch_title || actualData.batch_title || actualData.name || "The DevCoderZ Dashboard";

      return NextResponse.json({
        success: true,
        batch_title: batchTitle,
        subjects: standardizedSubjects,
        classes: actualData.classes || actualData.live_classes || []
      }, { headers });
    }

    // Chapters & Lectures ke liye direct return
    return NextResponse.json(rawData, { headers });

  } catch (error) {
    console.error("Proxy Error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500, headers }
    );
  }
}