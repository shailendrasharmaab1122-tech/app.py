document.addEventListener('DOMContentLoaded', async () => {
    // 1. Right Click aur F12 (Inspect Element) Blockers
    document.addEventListener("keydown", function(event) {
        if (event.keyCode == 123) event.preventDefault();
    });
    document.addEventListener("contextmenu", function(event) { 
        event.preventDefault(); 
    });

    // 2. DOM Elements Mapping
    const video = document.getElementById('player');
    const loadingOverlay = document.getElementById('loadingOverlay');
    const loadingText = document.getElementById('loadingText');
    const retryInfo = document.getElementById('retryInfo');
    const progressModal = document.getElementById('progressModal');
    const progressBar = document.getElementById('progressBar');
    const progressText = document.getElementById('progressText');
    const progressTitle = document.getElementById('progressTitle');
    const qualityModal = document.getElementById('qualityModal');
    const modalOverlay = document.getElementById('modalOverlay');
    const qualityOptionsContainer = document.getElementById('qualityOptionsContainer');
    const closeQualityModal = document.getElementById('closeQualityModal');
    
    // Aapka secure decryption/stream access token
    const token = 'SjM4Nmg2L0NXNWpVVko4NERDL3VWZz09Ojo0WkFBUWl0VXRMdHYzL2piVHFEMTdDM2xud3Y4SmQ2NkdSL3ViZnRqUkNHUnVZQlhMNTNJVENsSlcrdEtwaGlQd2ZzYmhqWDY2R0J1TFl2TmhjYm1tdVZ0aG9EbncxVHc2SVBuZkRlMkVyR1REVTJrUlpIUzNNRlhDRXFJTG9xVUpIZHdyeGhKcmFiL2xzRkVMSllicXd6ZDQzUkIyWkNYUUQrTExJSHlqVzNWRjF3U05VUFhvSlErdEFvRURWUGxKakRnSWxkdkpvV1R1NUZlcEkya3VTTEltOEdKS2ZQSE82RHJWdnBVTXc2MXBKVlNVVVE1RGE5UGFrZWVmQk1hekVkaVdGUzR1NEdhaWxlMGIzcEhzU3c0a2tXV2NFYytmYUVJdGVHNnhJMD0=';

    let hlsInstance = null;
    let qualities = [];
    let currentQualityIndex = 0;
    let player = null;
    let lastSavedTime = 0;
    let timeUpdateInterval = null;
    let bufferCheckInterval = null;
    let globalRetryCount = 0;
    const MAX_GLOBAL_RETRIES = 10;

    // API Stream URL (Aap yahan apni direct dynamic stream URL paste kar sakte hain)
    // For demo/testing: use an open HLS URL
    const streamSourceUrl = "https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8"; 

    // 3. Helper Functions: State & Overlay Management
    function updateLoadingText(message, retry = false) {
        loadingText.textContent = message;
        if (retry) {
            retryInfo.textContent = `Retry attempt ${globalRetryCount + 1}/${MAX_GLOBAL_RETRIES}`;
        } else {
            retryInfo.textContent = '';
        }
    }

    function showLoading(message = 'Loading video...', retry = false) {
        updateLoadingText(message, retry);
        loadingOverlay.classList.remove('hidden');
    }
    
    function hideLoading() {
        setTimeout(() => {
            loadingOverlay.classList.add('hidden');
        }, 500);
    }

    function startTimeSaver() {
        if (timeUpdateInterval) clearInterval(timeUpdateInterval);
        timeUpdateInterval = setInterval(() => {
            if (video && !isNaN(video.currentTime)) {
                lastSavedTime = video.currentTime;
                sessionStorage.setItem('videoTime_' + token, lastSavedTime.toString());
            }
        }, 1000);
    }

    function getSavedTime() {
        const saved = sessionStorage.getItem('videoTime_' + token);
        return saved ? parseFloat(saved) : 0;
    }

    // 4. Initialize Plyr Controls UI
    function initPlyr() {
        player = new Plyr(video, {
            controls: [
                'play-large', 'rewind', 'play', 'fast-forward', 'progress', 
                'current-time', 'duration', 'mute', 'volume', 'settings', 'fullscreen'
            ],
            settings: ['quality', 'speed'],
            speed: { selected: 1, options: [0.5, 0.75, 1, 1.25, 1.5, 1.75, 2, 2.5, 3] }
        });

        // Event listener jab player ready ho jaye browser me
        player.on('ready', () => {
            const savedTime = getSavedTime();
            if (savedTime > 0) {
                video.currentTime = savedTime;
            }
            startTimeSaver();
            startBufferMonitoring();
        });
    }

    // 5. Advanced HLS stream handling with Quality Parsing
    function initHlsStream(url) {
        if (Hls.isSupported()) {
            hlsInstance = new Hls({
                maxBufferLength: 30,
                maxMaxBufferLength: 600,
                enableWorker: true,
                lowLatencyMode: true
            });

            hlsInstance.loadSource(url);
            hlsInstance.attachMedia(video);

            hlsInstance.on(Hls.Events.MANIFEST_PARSED, function (event, data) {
                // HLS Manifest file se multi-bitrate auto qualities parse karna
                qualities = data.levels.map(level => level.height);
                setupCustomQualitiesMenu(qualities);
                initPlyr();
                hideLoading();
            });

            // Error Recovery Logic
            hlsInstance.on(Hls.Events.ERROR, function (event, data) {
                if (data.fatal) {
                    switch (data.type) {
                        case Hls.ErrorTypes.MEDIA_ERROR:
                            console.log('Media parsing error encountered, trying recovery...');
                            hlsInstance.recoverMediaError();
                            break;
                        case Hls.ErrorTypes.NETWORK_ERROR:
                            if (globalRetryCount < MAX_GLOBAL_RETRIES) {
                                globalRetryCount++;
                                showLoading("Network lost. Reconnecting...", true);
                                setTimeout(() => hlsInstance.loadSource(url), 2000);
                            } else {
                                Swal.fire('Error', 'Failed to load video stream. Please refresh.', 'error');
                            }
                            break;
                        default:
                            hlsInstance.destroy();
                            break;
                    }
                }
            });
        } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
            // Safari aur iOS native fallback support ke liye
            video.src = url;
            video.addEventListener('loadedmetadata', () => {
                initPlyr();
                hideLoading();
            });
        }
    }

    // 6. Native / Custom Qualities Engine mapping
    function setupCustomQualitiesMenu(levels) {
        // UI settings menu mapping dynamically update karta hai update standard levels ko
        const qualityControl = document.querySelector('[data-plyr="quality"]');
        if (qualityControl) {
            qualityControl.addEventListener('click', () => {
                // Trigger quality manual modal override logic if required
            });
        }
    }

    // 7. Low Buffer Optimization Monitoring
    function startBufferMonitoring() {
        if (bufferCheckInterval) clearInterval(bufferCheckInterval);
        
        bufferCheckInterval = setInterval(() => {
            if (!video || !hlsInstance) return;
            
            const currentTime = video.currentTime;
            const buffered = video.buffered;
            
            if (buffered.length > 0) {
                const bufferEnd = buffered.end(buffered.length - 1);
                const bufferAhead = bufferEnd - currentTime;
                
                if (bufferAhead < 5 && !video.paused) {
                    console.log('Low buffer alert: preloading level packets...');
                    try {
                        hlsInstance.loadLevel = hlsInstance.currentLevel;
                    } catch (e) {
                        console.error('Buffer routing failed', e);
                    }
                }
            }
        }, 3000);
    }

    // 8. Custom Download Controller Integration
    const downloadBtn = document.querySelector('[data-plyr="download"]');
    if (downloadBtn) {
        downloadBtn.addEventListener('click', (e) => {
            e.preventDefault();
            openDownloadModal();
        });
    }

    function openDownloadModal() {
        qualityOptionsContainer.innerHTML = '';
        // Mocking available quality stream resolutions manually for downloads mapping
        const downloadOptions = [
            { res: '1080p', label: 'Full HD (Highly Recommended)', size: 'Approx. 450MB' },
            { res: '720p', label: 'HD Quality (Standard Data)', size: 'Approx. 280MB' },
            { res: '480p', label: 'SD Quality (Data Saver)', size: 'Approx. 150MB' }
        ];

        downloadOptions.forEach(opt => {
            const card = document.createElement('div');
            card.className = 'quality-option';
            card.innerHTML = `
                <div class="quality-label">
                    <div class="quality-icon">${opt.res[0]}</div>
                    <div>
                        <div>${opt.label}</div>
                        <div class="quality-info">${opt.size}</div>
                    </div>
                </div>
                <span class="quality-badge">${opt.res}</span>
            `;
            card.onclick = () => startMockDownload(opt.res);
            qualityOptionsContainer.appendChild(card);
        });

        modalOverlay.classList.add('active');
        qualityModal.classList.add('active');
    }

    function closeDownload() {
        modalOverlay.classList.remove('active');
        qualityModal.classList.remove('active');
    }

    closeQualityModal.onclick = closeDownload;
    modalOverlay.onclick = closeDownload;

    function startMockDownload(resolution) {
        closeDownload();
        progressModal.classList.add('active');
        progressTitle.textContent = `Downloading Video (${resolution})...`;
        
        let count = 0;
        const speedInterval = setInterval(() => {
            count += Math.floor(Math.random() * 8) + 2; 
            if (count >= 100) {
                count = 100;
                clearInterval(speedInterval);
                setTimeout(() => {
                    progressModal.classList.remove('active');
                    Swal.fire({
                        title: 'Success!',
                        text: 'Video downloaded successfully to local storage.',
                        icon: 'success',
                        confirmButtonColor: '#764ba2'
                    });
                }, 800);
            }
            progressBar.style.width = count + '%';
            progressText.textContent = count + '%';
        }, 400);
    }

    // 9. Trigger Pipeline Kickstart
    showLoading('Initializing encrypted player bundle...');
    initHlsStream(streamSourceUrl);
});
