document.addEventListener('DOMContentLoaded', () => {
    const uploadForm = document.getElementById('uploadForm');
    const uploadStatus = document.getElementById('uploadStatus');
    const videoGrid = document.getElementById('videoGrid');
    
    const modal = document.getElementById('videoPreviewModal');
    const modalTitle = document.getElementById('previewTitle');
    const videoPlayer = document.getElementById('videoPlayer');
    const closeModalBtn = document.getElementById('closeModal');

    const loadVideos = async () => {
        try {
            const response = await fetch('/api/videos');
            const videos = await response.json();
            videoGrid.innerHTML = '';

            if (videos.length === 0) {
                videoGrid.innerHTML = '<p>No videos found. Upload one to get started.</p>';
                return;
            }

            videos.forEach(video => {
                const card = document.createElement('div');
                card.className = 'video-card';
                
                const filename = video.file_path.split(/[\\/]/).pop();

                card.innerHTML = `
                    <div>
                        <h3>${video.title}</h3>
                        <p>Source: ${video.source_type}</p>
                    </div>
                    <div class="video-card-actions">
                        <button class="preview-btn" data-video-path="${filename}" data-video-title="${video.title}">Preview</button>
                    </div>
                `;
                videoGrid.appendChild(card);
            });
        } catch (error) {
            console.error('Failed to load videos:', error);
        }
    };

    uploadForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        uploadStatus.textContent = 'Uploading, please wait...';
        
        const formData = new FormData();
        formData.append('title', document.getElementById('videoTitle').value);
        formData.append('videoFile', document.getElementById('videoFile').files[0]);

        try {
            const response = await fetch('/api/videos/upload', {
                method: 'POST',
                body: formData
            });
            
            const result = await response.json();
            if(response.ok) {
                uploadStatus.textContent = 'Upload successful!';
                uploadForm.reset();
                loadVideos();
            } else {
                uploadStatus.textContent = 'Error: ' + result.error;
            }
        } catch (error) {
            uploadStatus.textContent = 'Upload failed. See console for details.';
            console.error('Upload error:', error);
        }
        setTimeout(() => uploadStatus.textContent = '', 5000);
    });
    
    videoGrid.addEventListener('click', (e) => {
        if (e.target.classList.contains('preview-btn')) {
            const videoPath = e.target.dataset.videoPath;
            const videoTitle = e.target.dataset.videoTitle;
            
            modalTitle.textContent = videoTitle;
            videoPlayer.src = `/videos/${videoPath}`;
            modal.style.display = 'flex';
            videoPlayer.play();
        }
    });

    const closeModal = () => {
        modal.style.display = 'none';
        videoPlayer.pause();
        videoPlayer.src = '';
    };

    closeModalBtn.addEventListener('click', closeModal);
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            closeModal();
        }
    });

    loadVideos();
});
