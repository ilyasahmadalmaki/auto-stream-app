document.addEventListener('DOMContentLoaded', () => {
  const streamForm = document.getElementById('streamForm');
  const scheduleTypeSelect = document.getElementById('schedule_type');
  const onceFields = document.getElementById('onceFields');
  const dailyFields = document.getElementById('dailyFields');
  const videoSelect = document.getElementById('video_id');
  const streamsList = document.getElementById('streamsList');

  scheduleTypeSelect.addEventListener('change', () => {
    onceFields.style.display = scheduleTypeSelect.value === 'once' ? 'block' : 'none';
    dailyFields.style.display = scheduleTypeSelect.value === 'daily' ? 'block' : 'none';
  });

  const loadVideos = async () => {
    try {
      const response = await fetch('/api/videos');
      const videos = await response.json();
      videoSelect.innerHTML = '<option value="">-- Select a Video --</option>';
      videos.forEach(video => {
        const option = document.createElement('option');
        option.value = video.id;
        option.textContent = video.title;
        videoSelect.appendChild(option);
      });
    } catch (error) {
      console.error('Failed to load videos:', error);
    }
  };

  const loadStreams = async () => {
    try {
      const response = await fetch('/api/streams');
      const streams = await response.json();
      streamsList.innerHTML = '';
      streams.forEach(stream => {
        const card = document.createElement('div');
        card.className = 'card';
        const statusClass = `status-${stream.status}`;
        
        let scheduleInfo = '';
        if (stream.schedule_type === 'once') {
            scheduleInfo = `<p><strong>Type:</strong> Once</p>
                            <p><strong>Start:</strong> ${new Date(stream.start_time).toLocaleString()}</p>`;
        } else {
            scheduleInfo = `<p><strong>Type:</strong> Daily</p>
                            <p><strong>Time:</strong> ${stream.daily_start_time} for ${stream.daily_duration_hours}h</p>
                            <p><strong>Next Run:</strong> ${new Date(stream.next_start_time).toLocaleString()}</p>`;
        }

        card.innerHTML = `
          <h3>${stream.title}</h3>
          <p><strong>Video:</strong> ${stream.video_title}</p>
          ${scheduleInfo}
          <p><strong>Status:</strong> <span class="status ${statusClass}">${stream.status}</span> ${stream.is_process_running ? '(FFmpeg RUNNING)' : ''}</p>
        `;
        streamsList.appendChild(card);
      });
    } catch (error) {
      console.error('Failed to load streams:', error);
    }
  };

  streamForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const body = {
      title: document.getElementById('title').value,
      stream_key: document.getElementById('stream_key').value,
      video_id: document.getElementById('video_id').value,
      schedule_type: document.getElementById('schedule_type').value,
      start_datetime: document.getElementById('start_datetime').value,
      end_datetime: document.getElementById('end_datetime').value,
      daily_start_time: document.getElementById('daily_start_time').value,
      daily_duration_hours: document.getElementById('daily_duration_hours').value
    };
    
    const response = await fetch('/api/streams', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });

    const result = await response.json();
    if (response.ok) {
        alert('Stream scheduled!');
        streamForm.reset();
        loadStreams();
    } else {
        alert('Error: ' + result.error);
    }
  });

  loadVideos();
  loadStreams();
  setInterval(loadStreams, 15000);
});
