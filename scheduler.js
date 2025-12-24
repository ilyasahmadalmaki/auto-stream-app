// scheduler.js
const { db } = require('./db');
const { startStream, stopStream } = require('./streamManager');
const dayjs = require('dayjs');

const checkSchedules = () => {
  const now = new Date();
  console.log(`Scheduler running at: ${now.toISOString()}`);

  db.serialize(() => {
    // 1. Cek stream yang harus DIAKTIFKAN
    const startQuery = `
      SELECT s.*, v.file_path as video_path FROM streams s
      JOIN videos v ON s.video_id = v.id
      WHERE s.status = 'scheduled' AND s.next_start_time <= ?
    `;
    db.all(startQuery, [now.toISOString()], (err, rows) => {
      if (err) return console.error('Error fetching streams to start:', err);
      rows.forEach(stream => {
        console.log(`[SCHEDULER] Starting stream ID: ${stream.id}`);
        startStream(stream);
        db.run("UPDATE streams SET status = 'live', updated_at = ? WHERE id = ?", [new Date().toISOString(), stream.id]);
      });
    });

    // 2. Cek stream yang harus DIHENTIKAN
    const stopQuery = `
      SELECT * FROM streams WHERE status = 'live' AND next_end_time <= ?
    `;
    db.all(stopQuery, [now.toISOString()], (err, rows) => {
      if (err) return console.error('Error fetching streams to stop:', err);
      rows.forEach(stream => {
        console.log(`[SCHEDULER] Stopping stream ID: ${stream.id}`);
        stopStream(stream.id);

        if (stream.schedule_type === 'daily') {
          const nextStart = dayjs(stream.next_start_time).add(1, 'day');
          const nextEnd = nextStart.add(stream.daily_duration_hours, 'hour');
          
          db.run(
            "UPDATE streams SET status = 'scheduled', next_start_time = ?, next_end_time = ?, updated_at = ? WHERE id = ?",
            [nextStart.toISOString(), nextEnd.toISOString(), new Date().toISOString(), stream.id],
            (err) => {
              if (err) console.error('Error rescheduling daily stream:', err);
              else console.log(`[SCHEDULER] Rescheduled daily stream ID ${stream.id} for tomorrow.`);
            }
          );
        } else {
          db.run("UPDATE streams SET status = 'offline', updated_at = ? WHERE id = ?", [new Date().toISOString(), stream.id]);
        }
      });
    });
  });
};

const runScheduler = () => {
  console.log('Scheduler has been started. Will check every 30 seconds.');
  checkSchedules(); // Run immediately on start
  setInterval(checkSchedules, 30000);
};

module.exports = { runScheduler };
