const videoEl = document.getElementById('lecture-player');
const videoContainer = videoEl.parentElement;
let shakaPlayer = null;
let plyrInstance = null;

async function initPlayer(videoId, batchId, subjectSlug, topicSlug) {
  // 1. अपनी API से डेटा निकालें
  const response = await fetch(`/api/stream?video_id=${videoId}&batch_id=${batchId}&subjectSlug=${subjectSlug}&topicSlug=${topicSlug}`);
  const data = await response.json();
  
  if (!data.success) return console.error("Data fetch failed");

  // 2. Shaka Player Setup
  shakaPlayer = new shaka.Player(videoEl);
  shakaPlayer.configure({
    drm: { clearKeys: { [data.keyId]: data.keyValue } }
  });

  // Signed URL Fix
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
  const resolutions = [...new Map(tracks.filter(t => t.height).map(t => [t.height, t])).values()]
    .sort((a,b) => b.height - a.height).map(t => t.height);

  // 3. Plyr UI Setup
  plyrInstance = new Plyr(videoEl, {
    controls: ['play-large', 'rewind', 'play', 'mute', 'volume', 'fast-forward', 'progress', 'current-time', 'duration', 'download', 'settings', 'fullscreen'],
    settings: ['quality', 'speed'],
    quality: {
      default: 'Auto',
      options: ['Auto', ...resolutions],
      forced: true,
      onChange: (q) => {
        if (q === 'Auto') {
          shakaPlayer.configure({ abr: { enabled: true } });
        } else {
          shakaPlayer.configure({ abr: { enabled: false } });
          shakaPlayer.selectVariantTrack(tracks.find(t => t.height == q), true);
        }
      }
    },
    speed: { selected: 1, options: [0.5, 0.75, 1, 1.25, 1.5, 1.75, 2, 2.5, 3] }
  });
}
