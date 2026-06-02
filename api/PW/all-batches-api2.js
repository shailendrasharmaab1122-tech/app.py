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
    const name = searchParams.get('name');           // ← Dynamic name
    const subjectId = searchParams.get('subjectId') || searchParams.get('SubjectId');
    const subjectSlug = searchParams.get('subjectSlug');
    const topicSlug = searchParams.get('topicSlug');
    const contentType = searchParams.get('contentType') || 'videos';

    if (!batch_id) {
      return NextResponse.json({ success: false, error: "batch_id is required" }, { status: 400, headers });
    }

    let targetUrl = '';

    if (type === 'chapters' && subjectId) {
      targetUrl = `https://apiserver.deltastudy.site/api/pw/topics?BatchId=\( {encodeURIComponent(batch_id)}&SubjectId= \){encodeURIComponent(subjectId)}`;
    } 
    else if (type === 'lectures' && subjectSlug && topicSlug) {
      targetUrl = `https://apiserver.deltastudy.site/api/pw/datacontent?batchId=\( {encodeURIComponent(batch_id)}&subjectSlug= \){encodeURIComponent(subjectSlug)}&topicSlug=\( {encodeURIComponent(topicSlug)}&contentType= \){encodeURIComponent(contentType)}`;
    } 
    else {
      // Batches API - Dynamic (with or without name)
      targetUrl = `https://deltastudy.site/study-v2/batches/${batch_id}`;

      if (name) {
        targetUrl += `?name=${encodeURIComponent(name)}&_rsc=gts2v`;
      } else {
        targetUrl += `?_rsc=gts2v`;
      }
    }

    const response = await fetch(targetUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
      },
    });

    if (!response.ok) {
      return NextResponse.json({ success: false, error: `API Error: ${response.status}` }, { status: response.status, headers });
    }

    const data = await response.json();

    return NextResponse.json({
      success: true,
      type: type || 'batch',
      data: data
    }, { headers });

  } catch (error) {
    console.error("Proxy Error:", error);
    return NextResponse.json({ 
      success: false, 
      error: "Internal Server Error",
      message: error.message 
    }, { status: 500, headers });
  }
}