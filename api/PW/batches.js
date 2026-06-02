import { NextResponse } from 'next/server';

export async function GET(request) {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Content-Type': 'application/json',
  };

  try {
    const { searchParams } = new URL(request.url);
    const batch_id = searchParams.get('batch_id');
    const type = searchParams.get('type');

    if (!batch_id) {
      return NextResponse.json({ success: false, error: "batch_id is required" }, { status: 400, headers });
    }

    const targetUrl = `https://eduvibe-pw-api.wasmer.app/batch.php?batch_id=${encodeURIComponent(batch_id)}`;

    const response = await fetch(targetUrl, {
      headers: { 'User-Agent': 'Mozilla/5.0' },
    });

    if (!response.ok) {
      return NextResponse.json({ success: false, error: `API Error ${response.status}` }, { status: response.status, headers });
    }

    const rawData = await response.json();

    // Bahut simple return - transformation temporarily hata diya
    return NextResponse.json({
      success: true,
      batch_title: rawData.batch_title || rawData.name || "Arjuna JEE 2027",
      subjects: rawData.subjects || rawData.data?.subjects || [],
      classes: rawData.classes || [],
      raw: rawData // debug ke liye
    }, { headers });

  } catch (error) {
    console.error("Full Error:", error);
    return NextResponse.json({ 
      success: false, 
      error: "Server Error", 
      message: error.message || error.toString()
    }, { status: 500, headers });
  }
}