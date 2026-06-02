const videoEl = document.getElementById('lecture-player');
let shakaPlayer = null;

async function initPlayer(videoId, batchId, subjectSlug, topicSlug) {
  const response = await fetch(`/api/stream?video_id=${videoId}&batch_id=${batchId}&subjectSlug=${subjectSlug}&topicSlug=${topicSlug}`);
  const data = await response.json();
  if (!data.success) return;
  shakaPlayer = new shaka.Player(videoEl);
  if(data.keyId && data.keyValue) {
    shakaPlayer.configure({ drm: { clearKeys: { [data.keyId]: data.keyValue } } });
  }
  const manifestObj = new URL(data.manifestUrl);
  shakaPlayer.getNetworkingEngine().registerRequestFilter((type, request) => {
    if (type !== shaka.net.NetworkingEngine.RequestType.SEGMENT) return;
    manifestObj.searchParams.forEach((v, k) => {
      const segUrl = new URL(request.uris[0]);
      segUrl.searchParams.set(k, v);
      request.uris[0] = segUrl.toString();
    });
  });
  await shakaPlayer.load(data.manifestUrl);
  const tracks = shakaPlayer.getVariantTracks();
  const resolutions = [...new Map(tracks.filter(t => t.height).map(t => [t.height, t])).values()].sort((a,b) => b.height - a.height).map(t => t.height);
  new Plyr(videoEl, {
    controls: ['play-large', 'rewind', 'play', 'mute', 'volume', 'fast-forward', 'progress', 'current-time', 'duration', 'download', 'settings', 'fullscreen'],
    settings: ['quality', 'speed'],
    quality: {
      default: 'Auto',
      options: ['Auto', ...resolutions],
      forced: true,
      onChange: (q) => {
        if (q === 'Auto') shakaPlayer.configure({ abr: { enabled: true } });
        else {
          shakaPlayer.configure({ abr: { enabled: false } });
          shakaPlayer.selectVariantTrack(tracks.find(t => t.height == q), true);
        }
      }
    }
  });
}
