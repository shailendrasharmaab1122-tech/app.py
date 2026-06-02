export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  if (req.method === 'OPTIONS') return res.status(200).end();
  const { video_id, batch_id, subjectSlug, topicSlug } = req.query;
  const bId = batch_id || "698ad3519549b300a5e1cc6a";
  if (subjectSlug && topicSlug) {
    try {
      const dResponse = await fetch(`https://apiserver.deltastudy.site/api/pw/datacontent?batchId=${bId}&subjectSlug=${subjectSlug}&topicSlug=${topicSlug}&contentType=videos`);
      if (dResponse.ok) {
        const responseData = await dResponse.json();
        const videosList = responseData.data || responseData;
        const matchVideo = videosList.find(v => v.videoDetails?._id === video_id || v._id === video_id);
        if (matchVideo && matchVideo.videoDetails?.manifestUrl) {
          return res.status(200).json({ success: true, manifestUrl: matchVideo.videoDetails.manifestUrl, source: "Delta-Internal-API" });
        }
      }
    } catch (err) {}
  }
  try {
    const vResponse = await fetch(`https://eduvibe-pw-api.wasmer.app/get-lectures.php?batch_id=${bId}&video_id=${video_id}&tab=videos`);
    if (vResponse.ok) {
      const vData = await vResponse.json();
      const lecture = vData.lectures?.find(l => l?.videoDetails?._id === video_id || l?._id === video_id);
      if (lecture && lecture.videoDetails?.manifestUrl) {
        return res.status(200).json({ success: true, manifestUrl: lecture.videoDetails.manifestUrl, source: "EduVibe-Tunnel-V3" });
      }
    }
  } catch (err) {}
  return res.status(200).json({ success: true, manifestUrl: `https://sec-prod-mediacdn.pw.live/files/${video_id}/master.mpd`, source: "Unsigned-Raw-Tunnel" });
}
