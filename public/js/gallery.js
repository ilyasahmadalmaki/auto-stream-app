document.addEventListener('DOMContentLoaded', () => {
    const videoListEl = document.getElementById('video-list');
    const modalOverlay = document.getElementById('modal-overlay');
    const modalContent = document.getElementById('modal-content');
    
    const formatBytes = (bytes = 0) => { /* ... fungsi format bytes dari jawaban sebelumnya ... */ };
    const formatDuration = (seconds = 0) => { /* ... fungsi format durasi dari jawaban sebelumnya ... */ };

    const loadVideos = async () => {
        try {
            const res = await fetch('/api/videos');
            const videos = await res.json();
            if (videos.length === 0) {
                videoListEl.innerHTML = '<p class="empty-state">No videos found.</p>';
                return;
            }
            videoListEl.innerHTML = videos.map(video => `
                <div class="video-card">
                    <h4>${video.title}</h4>
                    <p><strong>Source:</strong> ${video.source_type}</p>
                    <p><strong>Size:</strong> ${formatBytes(video.file_size)}</p>
                    <div class="video-card-actions">
                        <button class="btn" data-action="preview" data-path="${video.file_path}">Preview</button>
                    </div>
                </div>`).join('');
        } catch (e) { videoListEl.innerHTML = '<p class="empty-state">Failed to load videos.</p>'; }
    };
    
    const showPreview = (path) => { /* ... logika preview dari jawaban sebelumnya ... */ };
    
    videoListEl.addEventListener('click', (e) => { /* ... logika klik dari jawaban sebelumnya ... */ });
    modalOverlay.addEventListener('click', (e) => { if (e.target === modalOverlay) modalOverlay.style.display = 'none'; });
    
    loadVideos();
});
