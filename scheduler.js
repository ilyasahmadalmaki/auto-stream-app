// scheduler.js (Versi Final)
const { db } = require('./db');
const { streamManager } = require('./streamManager');
const dayjs = require('dayjs');

const checkSchedules = () => {
  const now = new Date();
  console.log(`[Scheduler] Running check at: ${now.toISOString()}`);

  db.serialize(() => {
    // 1. Cek stream yang statusnya 'scheduled' dan waktunya sudah tiba untuk dimulai
    const startQuery = `
      SELECT s.*, v.file_path as video_path FROM streams s
      JOIN videos v ON s.video_id = v.id
      WHERE s.status = 'scheduled' AND s.next_start_time <= ?
    `;
    db.all(startQuery, [now.toISOString()], (err, rows) => {
      if (err) return console.error('[Scheduler] Error fetching streams to start:', err.message);
      
      rows.forEach(stream => {
        console.log(`[Scheduler] Starting scheduled stream ID: ${stream.id}`);
        streamManager.startStream(stream);
        db.run("UPDATE streams SET status = 'live', updated_at = ? WHERE id = ?", [new Date().toISOString(), stream.id]);
      });
    });

    // 2. Cek stream yang statusnya 'live' dan waktunya sudah habis untuk dihentikan
    const stopQuery = `
      SELECT * FROM streams WHERE status = 'live' AND next_end_time <= ?
    `;
    db.all(stopQuery, [now.toISOString()], (err, rows) => {
      if (err) return console.error('[Scheduler] Error fetching streams to stop:', err.message);

      rows.forEach(stream => {
        console.log(`[Scheduler] Stopping scheduled stream ID: ${stream.id}`);
        streamManager.stopStream(stream.id);

        if (stream.schedule_type === 'daily') {
          // Jika tipenya harian, buat jadwal baru untuk besok
          const nextStart = dayjs(stream.next_start_time).add(1, 'day');
          const nextEnd = nextStart.add(stream.daily_duration_hours, 'hour');
          
          db.run(
            "UPDATE streams SET status = 'scheduled', next_start_time = ?, next_end_time = ?, updated_at = ? WHERE id = ?",
            [nextStart.toISOString(), nextEnd.toISOString(), new Date().toISOString(), stream.id],
            (updateErr) => {
              if (updateErr) console.error('[Scheduler] Error rescheduling daily stream:', updateErr.message);
              else console.log(`[Scheduler] Rescheduled daily stream ID ${stream.id} for tomorrow.`);
            }
          );
        } else {
          // Jika tipenya sekali jalan, cukup ubah status menjadi offline
          db.run("UPDATE streams SET status = 'offline', updated_at = ? WHERE id = ?", [new Date().toISOString(), stream.id]);
        }
      });
    });
  });
};

const runScheduler = () => {
  console.log('[Scheduler] Started. Checks will run every 30 seconds.');
  // Jalankan sekali saat aplikasi start, lalu set interval
  checkSchedules(); 
  setInterval(checkSchedules, 30000); // 30 detik
};

module.exports = { runScheduler };
