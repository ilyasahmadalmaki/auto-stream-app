// public/js/dashboard.js (Versi dengan Day.js untuk tanggal)
document.addEventListener('DOMContentLoaded', () => {
    // Muat plugin Day.js
    dayjs.extend(window.dayjs_plugin_utc);
    dayjs.extend(window.dayjs_plugin_timezone);

    // --- Elemen DOM ---
    const clockEl = document.getElementById('digital-clock');
    const dateEl = document.getElementById('date-display');
    const statsEl = document.getElementById('system-stats');
    const streamListEl = document.getElementById('stream-list');
    const addStreamBtn = document.getElementById('add-stream-btn');
    const modalOverlay = document.getElementById('modal-overlay');
    const modalContent = document.getElementById('modal-content');

    // ... (fungsi formatBytes tetap sama) ...
    const formatBytes = (bytes = 0, decimals = 1) => {
        if (!+bytes) return '0 B';
        const k = 1024;
        const dm = decimals < 0 ? 0 : decimals;
        const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
    };

    const updateTime = () => {
        const now = new Date();
        clockEl.textContent = now.toLocaleTimeString('en-GB');
        dateEl.textContent = now.toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    };

    const updateStats = async () => { /* ... fungsi ini tetap sama ... */ };
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
            streamListEl.innerHTML = streams.map(stream => {
                // --- PERUBAHAN UTAMA DI SINI ---
                // Gunakan dayjs untuk memformat tanggal dengan andal
                const nextStart = dayjs(stream.next_start_time).format('DD/MM/YYYY HH:mm:ss');
                const nextEnd = dayjs(stream.next_end_time).format('DD/MM/YYYY HH:mm:ss');

                return `
                <div class="stream-item">
                    <div><strong>${stream.title}</strong><br><small style="text-transform: capitalize;">${stream.schedule_type}</small></div>
                    <div class="stream-item-status"><span class="status-${stream.status}">${stream.status}</span></div>
                    <div><small>Start:</small><br>${nextStart}</div>
                    <div><small>End:</small><br>${nextEnd}</div>
                    <div class="stream-item-actions">
                        <button title="Manual Start" class="action-btn" data-action="start" data-id="${stream.id}" ${stream.status === 'live' ? 'disabled' : ''}>▶️</button>
                        <button title="Manual Stop" class="action-btn" data-action="stop" data-id="${stream.id}" ${stream.status !== 'live' ? 'disabled' : ''}>⏹️</button>
                        <button title="Edit Stream" class="action-btn" data-action="edit" data-id="${stream.id}">✏️</button>
                        <button title="Delete Stream" class="action-btn" data-action="delete" data-id="${stream.id}">🗑️</button>
                    </div>
                </div>`;
            }).join('');
        } catch (e) {
            console.error("Failed to load streams:", e);
            streamListEl.innerHTML = `<p class="empty-state">Error loading streams. Check console.</p>`;
        }
    };
    
    // ... (fungsi openFormModal dan handleAction tetap sama seperti versi lengkap sebelumnya) ...

    // --- Inisialisasi ---
    updateTime(); updateStats(); loadStreams();
    setInterval(updateTime, 1000);
    setInterval(updateStats, 2000);
    setInterval(loadStreams, 5000);
});

// Salin juga implementasi lengkap dari fungsi updateStats, openFormModal, dan handleAction dari jawaban sebelumnya untuk memastikan tidak ada yang terlewat.
