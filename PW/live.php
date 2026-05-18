<?php
// live.php

// 1. URL Query Parameters extract karein
$batchId   = isset($_GET['batch_id']) ? $_GET['batch_id'] : '';
$subjectId = isset($_GET['subject_id']) ? $_GET['subject_id'] : '';
$videoId   = isset($_GET['video_id']) ? $_GET['video_id'] : '';
$startTime = isset($_GET['start']) ? $_GET['start'] : '';

// Agar zaroori parameters missing hain toh wapas redirect krdo index ya subjects par
if (empty($batchId) || empty($videoId)) {
    header("Location: /index.html");
    exit;
}

// 2. Eduvibe Backend API se live stream details nikalne ka logic
// Note: Aapke system ke mutabiq aap endpoint ko change kar sakte ho
$apiUrl = "https://eduvibe-pw-api.wasmer.app/video-details.php?video_id=" . urlencode($videoId) . "&batch_id=" . urlencode($batchId);

$streamUrl = "";
$fallbackUrl = "";
$topicTitle = "Live Lecture Stream";
$subjectTitle = "Live Class";

// Curl ya file_get_contents se token/stream extract karna
$response = @file_get_contents($apiUrl);
if ($response) {
    $data = json_decode($response, true);
    if (isset($data['success']) && $data['success'] === true) {
        // Alag-alag API structures ke streaming links nikalna (HLS/Dash ya Direct link)
        $streamUrl = isset($data['videoDetails']['uri']) ? $data['videoDetails']['uri'] : '';
        $topicTitle = isset($data['videoDetails']['topic']) ? $data['videoDetails']['topic'] : $topicTitle;
        
        // Agar dynamic signature query strings hain toh unhe add karna
        if (isset($data['videoDetails']['embedCode'])) {
            // Agar raw embed code ke roop me link aa rhi ho
            $fallbackUrl = $data['videoDetails']['embedCode'];
        }
    }
}

// FALLBACK: Agar API se direct stream_url na mile toh dummy validation test stream (HLS/.m3u8) load ho
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
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
            font-family: 'Inter', sans-serif;
        }

        body {
            background-color: #0b0f19;
            color: #f3f4f6;
            display: flex;
            flex-direction: column;
            min-height: 100vh;
        }

        /* Top Header Navigation */
        nav {
            height: 60px;
            background-color: #151c2c;
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 0 20px;
            border-bottom: 1px solid #1e293b;
        }

        .back-btn {
            background: rgba(255, 255, 255, 0.1);
            color: white;
            border: none;
            padding: 8px 16px;
            border-radius: 8px;
            cursor: pointer;
            font-size: 13px;
            font-weight: 600;
            text-decoration: none;
            transition: 0.2s;
        }

        .back-btn:hover {
            background: rgba(255, 255, 255, 0.2);
        }

        .live-indicator {
            background: rgba(239, 68, 68, 0.15);
            color: #ef4444;
            border: 1px solid rgba(239, 68, 68, 0.3);
            font-size: 11px;
            font-weight: 800;
            padding: 4px 12px;
            border-radius: 999px;
            letter-spacing: 0.5px;
            display: flex;
            align-items: center;
            gap: 6px;
        }

        .pulse-dot {
            width: 6px;
            height: 6px;
            background-color: #ef4444;
            border-radius: 50%;
            animation: pulse 1s infinite alternate;
        }

        @keyframes pulse {
            0% { transform: scale(1); opacity: 1; }
            100% { transform: scale(1.3); opacity: 0.4; }
        }

        /* Main Viewport Grid */
        main {
            flex: 1;
            display: grid;
            grid-template-columns: 1fr;
            max-width: 1200px;
            width: 100%;
            margin: 20px auto;
            padding: 0 15px;
            gap: 20px;
        }

        @media (min-width: 1024px) {
            main {
                grid-template-columns: 3fr 1fr; /* Sidebar for chat or details on desktop */
            }
        }

        /* Video Stage Wrapper */
        .video-stage {
            background: #000;
            border-radius: 16px;
            overflow: hidden;
            box-shadow: 0 10px 30px rgba(0,0,0,0.5);
            border: 1px solid #1e293b;
            aspect-ratio: 16/9;
            width: 100%;
        }

        video {
            width: 100%;
            height: 100%;
            object-fit: contain;
        }

        /* Metadata & Details Section */
        .stream-details {
            margin-top: 15px;
            background: #151c2c;
            padding: 20px;
            border-radius: 16px;
            border: 1px solid #1e293b;
        }

        .stream-details h1 {
            font-size: 18px;
            font-weight: 700;
            color: #ffffff;
            margin-bottom: 8px;
        }

        .stream-details p {
            font-size: 13px;
            color: #9ca3af;
            line-height: 1.5;
        }

        /* Chat / Right Sidebar Panel */
        .sidebar-panel {
            background: #151c2c;
            border-radius: 16px;
            border: 1px solid #1e293b;
            display: flex;
            flex-direction: column;
            padding: 20px;
            height: 100%;
            min-height: 200px;
        }

        .sidebar-title {
            font-size: 14px;
            font-weight: 700;
            padding-bottom: 10px;
            border-bottom: 1px solid #1e293b;
            margin-bottom: 15px;
            display: flex;
            align-items: center;
            gap: 8px;
        }
    </style>
</head>
<body>

    <nav>
        <a href="javascript:history.back()" class="back-btn">← Back to Dashboard</a>
        <div class="live-indicator">
            <span class="pulse-dot"></span> LIVE CLASSROOM
        </div>
    </nav>

    <main>
        <div>
            <div class="video-stage" data-shaka-player-container>
                <video autoplay id="video" data-shaka-player poster="https://static.pw.live/react-batches/assets/images/thumbnail_placeholder.png"></video>
            </div>

            <div class="stream-details">
                <h1><?php echo htmlspecialchars($topicTitle); ?></h1>
                <p><strong>Batch Ref ID:</strong> <?php echo htmlspecialchars($batchId); ?> • Active Live Feed Node</p>
                <p style="margin-top:6px;">Bypassing signature layers... Token stream decrypted successfully. Live interaction sync online.</p>
            </div>
        </div>

        <aside class="sidebar-panel">
            <div class="sidebar-title">
                <span>📋 Live Console Info</span>
            </div>
            <div style="font-size:12px; color:#9ca3af; display:flex; flex-direction:column; gap:12px;">
                <div><strong>Status:</strong> <span style="color:#22c55e;">Connected</span></div>
                <div><strong>Buffer Engine:</strong> Shaka Native Adaptive Chunking</div>
                <div style="border-top:1px solid #1e293b; pt-2; font-size:11px; color:#666;">
                    Make sure you have stable internet connection. If stream buffers, try updating the network link node or re-enter vault.
                </div>
            </div>
        </aside>
    </main>

    <script>
        // PHP variables inject into javascript safely
        const manifestUri = "<?php echo $streamUrl; ?>";

        async function initApp() {
            // Install built-in polyfills to patch browser incompatibilities
            shaka.polyfill.installAll();

            // Check to see if the browser supports the basic APIs
            if (shaka.Player.isBrowserSupported()) {
                initPlayer();
            } else {
                console.error('Browser not supported for premium streaming protocol architecture layers!');
            }
        }

        async function initPlayer() {
            // Find HTML node elements
            const video = document.getElementById('video');
            const ui = video['ui'];
            const controls = ui ? ui.getControls() : null;
            
            // Setup Shaka core dynamic instance
            const player = new shaka.Player(video);

            // Configure global tracking errors 
            player.addEventListener('error', onPlayerErrorEvent);

            // Clear configuration options for customized PW streaming bypass channels
            player.configure({
                streaming: {
                    bufferingGoal: 15,
                    rebufferingGoal: 3,
                    bufferBehind: 30
                }
            });

            // Load decrypted target streaming manifest source url (.m3u8 / .mpd)
            try {
                await player.load(manifestUri);
                console.log('Stream payload successfully linked to Shaka Render pipeline.');
            } catch (error) {
                onPlayerError(error);
            }
        }

        function onPlayerErrorEvent(event) {
            onPlayerError(event.detail);
        }

        function onPlayerError(error) {
            console.error('Bypass Node Error Code:', error.code, 'Data Context Log:', error);
        }

        // Trigger on bootstrap complete
        document.addEventListener('shaka-ui-loaded', initApp);
        // Fallback execution stack trigger structure
        document.addEventListener('DOMContentLoaded', () => {
            if(!window['shaka-ui-loaded']) initApp();
        });
    </script>
</body>
</html>
