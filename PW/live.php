<?php
// live.php - Wasmer Production Fix

$batchId   = isset($_GET['batch_id']) ? $_GET['batch_id'] : '';
$subjectId = isset($_GET['subject_id']) ? $_GET['subject_id'] : '';
$videoId   = isset($_GET['video_id']) ? $_GET['video_id'] : '';

if (empty($batchId) || empty($videoId)) {
    echo "<h2 style='color:white; text-align:center; margin-top:50px;'>Error: Missing Parameters!</h2>";
    exit;
}

// EduVibe ki original target API jahan se video details aani hain
$apiUrl = "https://eduvibe-pw-api.wasmer.app/video-details.php?video_id=" . urlencode($videoId) . "&batch_id=" . urlencode($batchId);

$streamUrl = "";
$topicTitle = "Live Class Stream";

// Server-side fetching (CORS Bypass automatically)
$response = @file_get_contents($apiUrl);

if ($response) {
    $data = json_decode($response, true);
    
    // Alag-alag API responses ke mutabiq keys check karna
    if (isset($data['success']) && $data['success'] === true) {
        if (isset($data['videoDetails']['uri'])) {
            $streamUrl = $data['videoDetails']['uri']; // Standard HLS/DASH Link
        } elseif (isset($data['videoDetails']['url'])) {
            $streamUrl = $data['videoDetails']['url']; // Alternate Link key
        }
        
        if (isset($data['videoDetails']['topic'])) {
            $topicTitle = $data['videoDetails']['topic'];
        }
    }
}

// FALLBACK: Agar class band ho, token expire ho, ya API blank ho toh Big Buck Bunny chalega test ke liye
if (empty($streamUrl)) {
    $streamUrl = "https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8"; 
}
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>LIVE: <?php echo htmlspecialchars($topicTitle); ?></title>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/shaka-player/4.3.5/shaka-player.compiled.js"></script>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/shaka-player/4.3.5/controls.css">
    
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; font-family: 'Inter', sans-serif; }
        body { background-color: #0b0f19; color: #f3f4f6; display: flex; flex-direction: column; min-height: 100vh; }
        nav { height: 60px; background-color: #151c2c; display: flex; align-items: center; justify-content: space-between; padding: 0 20px; border-bottom: 1px solid #1e293b; }
        .back-btn { background: rgba(255, 255, 255, 0.1); color: white; border: none; padding: 8px 16px; border-radius: 8px; cursor: pointer; font-size: 13px; font-weight: 600; text-decoration: none; transition: 0.2s; }
        .back-btn:hover { background: rgba(255, 255, 255, 0.2); }
        .live-indicator { background: rgba(239, 68, 68, 0.15); color: #ef4444; border: 1px solid rgba(239, 68, 68, 0.3); font-size: 11px; font-weight: 800; padding: 4px 12px; border-radius: 999px; display: flex; align-items: center; gap: 6px; }
        .pulse-dot { width: 6px; height: 6px; background-color: #ef4444; border-radius: 50%; animation: pulse 1s infinite alternate; }
        @keyframes pulse { 0% { transform: scale(1); opacity: 1; } 100% { transform: scale(1.3); opacity: 0.4; } }
        main { flex: 1; display: grid; grid-template-columns: 1fr; max-width: 1200px; width: 100%; margin: 20px auto; padding: 0 15px; gap: 20px; }
        @media (min-width: 1024px) { main { grid-template-columns: 3fr 1fr; } }
        .video-stage { background: #000; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 30px rgba(0,0,0,0.5); border: 1px solid #1e293b; aspect-ratio: 16/9; width: 100%; }
        video { width: 100%; height: 100%; object-fit: contain; }
        .stream-details { margin-top: 15px; background: #151c2c; padding: 20px; border-radius: 16px; border: 1px solid #1e293b; }
        .stream-details h1 { font-size: 18px; font-weight: 700; color: #ffffff; margin-bottom: 8px; }
        .stream-details p { font-size: 13px; color: #9ca3af; line-height: 1.5; }
        .sidebar-panel { background: #151c2c; border-radius: 16px; border: 1px solid #1e293b; display: flex; flex-direction: column; padding: 20px; height: 100%; min-height: 200px; }
        .sidebar-title { font-size: 14px; font-weight: 700; padding-bottom: 10px; border-bottom: 1px solid #1e293b; margin-bottom: 15px; }
    </style>
</head>
<body>

    <nav>
        <a href="javascript:history.back()" class="back-btn">← Back</a>
        <div class="live-indicator"><span class="pulse-dot"></span> LIVE STREAM NODE</div>
    </nav>

    <main>
        <div>
            <div class="video-stage" data-shaka-player-container>
                <video autoplay id="video" data-shaka-player poster="https://static.pw.live/react-batches/assets/images/thumbnail_placeholder.png" controls></video>
            </div>
            <div class="stream-details">
                <h1><?php echo htmlspecialchars($topicTitle); ?></h1>
                <p><strong>Batch ID:</strong> <?php echo htmlspecialchars($batchId); ?></p>
                <p style="margin-top:6px; color:#22c55e;">Wasmer Server Side Tunnel: Active & Secure</p>
            </div>
        </div>

        <aside class="sidebar-panel">
            <div class="sidebar-title">📋 Console Info</div>
            <div style="font-size:12px; color:#9ca3af; display:flex; flex-direction:column; gap:12px;">
                <div><strong>Status:</strong> <span style="color:#22c55e;">Connected</span></div>
                <div><strong>Engine:</strong> Shaka Native Adaptive Player</div>
            </div>
        </aside>
    </main>

    <script>
        const manifestUri = "<?php echo $streamUrl; ?>";

        async function initPlayer() {
            shaka.polyfill.installAll();
            if (shaka.Player.isBrowserSupported()) {
                const video = document.getElementById('video');
                const player = new shaka.Player(video);
                
                player.configure({
                    streaming: {
                        bufferingGoal: 10,
                        rebufferingGoal: 2
                    }
                });

                try {
                    await player.load(manifestUri);
                    console.log('Stream loaded smoothly!');
                } catch (error) {
                    console.error('Shaka Error:', error);
                }
            }
        }

        document.addEventListener('DOMContentLoaded', initPlayer);
    </script>
</body>
</html>
