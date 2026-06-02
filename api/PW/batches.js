import { NextResponse } from 'next/server';

export async function GET(request) {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Content-Type': 'application/json; charset=utf-8',
  };

  try {
    const { searchParams } = new URL(request.url);
    
    const batch_id = searchParams.get('batch_id');
    const type = searchParams.get('type');
    const subject_id = searchParams.get('subject_id');
    const topic_id = searchParams.get('topic_id');
    const tab = searchParams.get('tab') || 'videos';

    if (!batch_id) {
      return NextResponse.json({ success: false, error: "batch_id is required" }, { status: 400, headers });
    }

    let targetUrl = '';

    if (type === 'chapters' && subject_id) {
      targetUrl = `https://eduvibe-pw-api.wasmer.app/chapters.php?batch_id=\( {encodeURIComponent(batch_id)}&subject_id= \){encodeURIComponent(subject_id)}`;
    } 
    else if (type === 'lectures' && subject_id && topic_id) {
      targetUrl = `https://eduvibe-pw-api.wasmer.app/get-lectures.php?batch_id=\( {encodeURIComponent(batch_id)}&subject_id= \){encodeURIComponent(subject_id)}&topic_id=\( {encodeURIComponent(topic_id)}&tab= \){encodeURIComponent(tab)}`;
    } 
    else {
      // Default: Batch Details
      targetUrl = `https://eduvibe-pw-api.wasmer.app/batch.php?batch_id=${encodeURIComponent(batch_id)}`;
    }

    const response = await fetch(targetUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
    });

    if (!response.ok) {
      return NextResponse.json({ success: false, error: `API Error: ${response.status}` }, { status: response.status, headers });
    }

    const rawData = await response.json();

    // Batch ke liye clean transformation
    if (!type || type === 'batch') {
      const subjects = (rawData.subjects || []).map(sub => ({
        _id: sub._id || sub.subjectId?._id,
        name: sub.subject || sub.name || "Unknown Subject",
        subject: sub.subject || sub.name,
        lectureCount: sub.lectureCount || 0,
        teacherName: sub.teacherIds?.[0]?.firstName 
                     ? `${sub.teacherIds[0].firstName} ${sub.teacherIds[0].lastName || ''}`.trim() 
                     : "Faculty Team",
        image: sub.imageId?.baseUrl && sub.imageId?.key 
               ? sub.imageId.baseUrl + sub.imageId.key 
               : "https://static.pw.live/react-batches/assets/svg/subjects/defaultSubject.svg",
        slug: sub.slug || ""
      }));

      return NextResponse.json({
        success: true,
        batch_title: rawData.batch_title || "Arjuna JEE 2027",
        subjects: subjects,
        classes: rawData.classes || [],
        total_classes: rawData.total_classes || 0
      }, { headers });
    }

    // Chapters aur Lectures ke liye raw data return
    return NextResponse.json(rawData, { headers });

  } catch (error) {
    console.error("Proxy Error:", error);
    return NextResponse.json({ 
      success: false, 
      error: "Internal Server Error",
      message: error.message 
    }, { status: 500, headers });
  }
}