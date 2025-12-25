// public/js/dashboard.js (Kembali ke Versi Stabil Tanpa Day.js)
document.addEventListener('DOMContentLoaded', () => {
    // --- Elemen DOM ---
    const clockEl = document.getElementById('digital-clock');
    const dateEl = document.getElementById('date-display');
    const statsEl = document.getElementById('system-stats');
    const streamListEl = document.getElementById('stream-list');
    const addStreamBtn = document.getElementById('add-stream-btn');
    const modalOverlay = document.getElementById('modal-overlay');
    const modalContent = document.getElementById('modal-content');

    const formatBytes = (bytes = 0, decimals = 1) => { /* ... fungsi format bytes ... */ };
    const updateTime = () => { /* ... fungsi update time ... */ };
    const updateStats = async () => { /* ... fungsi update stats ... */ };

    const loadStreams = async () => {
        try {
            const res = await fetch('/api/streams');
            if (!res.ok) throw new Error('API failed');
            const streams = await res.json();
            if (!Array.isArray(streams)) throw new Error('Invalid data format');

            if (streams.length === 0) {
                streamListEl.innerHTML = '<p class="empty-state">No streams found.</p>';
                return;
            }
            streamListEl.innerHTML = streams.map(stream => `
                <div class="stream-item">
                    <div><strong>${stream.title}</strong><br><small>${stream.schedule_type}</small></div>
                    <div><span class="status-${stream.status}">${stream.status}</span></div>
                    <div><small>Start:</small><br>${new Date(stream.next_start_time).toLocaleString('id-ID')}</div>
                    <div><small>End:</small><br>${new Date(stream.next_end_time).toLocaleString('id-ID')}</div>
                    <div class="stream-item-actions">
                        <button title="Start" class="action-btn" data-action="start" data-id="${stream.id}" ${stream.status === 'live' ? 'disabled' : ''}>▶️</button>
                        <button title="Stop" class="action-btn" data-action="stop" data-id="${stream.id}" ${stream.status !== 'live' ? 'disabled' : ''}>⏹️</button>
                        <button title="Edit" class="action-btn" data-action="edit" data-id="${stream.id}">✏️</button>
                        <button title="Delete" class="action-btn" data-action="delete" data-id="${stream.id}">🗑️</button>
                    </div>
                </div>`).join('');
        } catch (e) {
            console.error("Failed to load streams:", e);
            streamListEl.innerHTML = `<p class="empty-state">Error loading streams.</p>`;
        }
    };
    
    const openFormModal = async (title, streamId = null) => { /* ... fungsi lengkap dari jawaban sebelumnya ... */ };
    const handleAction = async (action, id) => { /* ... fungsi lengkap dari jawaban sebelumnya ... */ };

    // --- Inisialisasi ---
    streamListEl.addEventListener('click', (e) => handleAction(e.target.closest('.action-btn')?.dataset.action, e.target.closest('.action-btn')?.dataset.id));
    addStreamBtn.addEventListener('click', () => openFormModal('Add New Stream'));
    modalOverlay.addEventListener('click', (e) => { if (e.target === modalOverlay) modalOverlay.style.display = 'none'; });

    updateTime(); updateStats(); loadStreams();
    setInterval(updateTime, 1000);
    setInterval(updateStats, 2000);
    setInterval(loadStreams, 5000);
});
