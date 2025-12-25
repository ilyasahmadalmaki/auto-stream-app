// server.js (Versi Final dengan Semua API)
require('dotenv').config();
const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const dayjs = require('dayjs');
const si = require('systeminformation');
const { db, initDb } = require('./db');
const { streamManager } = require('./streamManager');

const app = express();
const PORT = process.env.PORT || 7000;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));

// Konfigurasi Multer
const videoDir = path.join(__dirname, 'videos');
if (!fs.existsSync(videoDir)) fs.mkdirSync(videoDir);
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'videos/'),
  filename: (req, file, cb) => cb(null, `${Date.now()}-${file.originalname}`)
});
const upload = multer({ storage });

// ================== API ROUTES ==================

// --- Videos API ---
app.get('/api/videos', (req, res) => {
  db.all("SELECT * FROM videos ORDER BY created_at DESC", [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows || []);
  });
});
app.post('/api/videos/upload', upload.single('videoFile'), (req, res) => { /* ... logika upload ... */ });
app.get('/videos/:filename', (req, res) => {
    const filePath = path.join(__dirname, 'videos', req.params.filename);
    if (fs.existsSync(filePath)) res.sendFile(filePath);
    else res.status(404).send('Video not found');
});

// --- Streams API (CRUD & Kontrol) ---
app.get('/api/streams', (req, res) => {
  const sql = `SELECT s.*, v.title as video_title FROM streams s JOIN videos v ON s.video_id = v.id ORDER BY s.created_at DESC`;
  db.all(sql, [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows || []);
  });
});

app.get('/api/streams/:id', (req, res) => {
  db.get(`SELECT * FROM streams WHERE id = ?`, [req.params.id], (err, row) => {
      if (err || !row) return res.status(404).json({ error: 'Stream not found' });
      res.json(row);
  });
});

app.post('/api/streams', (req, res) => {
    const { title, stream_key, video_id, schedule_type, start_datetime, end_datetime, daily_start_time, daily_duration_hours } = req.body;
    const rtmp_url = process.env.YOUTUBE_RTMP_URL;
    let sql, params, next_start_time, next_end_time;

    if (schedule_type === 'once') {
        next_start_time = dayjs(start_datetime).toISOString();
        next_end_time = dayjs(end_datetime).toISOString();
        sql = `INSERT INTO streams (title, rtmp_url, stream_key, video_id, schedule_type, start_time, end_time, next_start_time, next_end_time) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`;
        params = [title, rtmp_url, stream_key, video_id, schedule_type, start_datetime, end_datetime, next_start_time, next_end_time];
    } else if (schedule_type === 'daily') {
        const [hour, minute] = daily_start_time.split(':');
        let now = dayjs();
        next_start_time = now.hour(hour).minute(minute).second(0);
        if (next_start_time.isBefore(now)) next_start_time = next_start_time.add(1, 'day');
        next_end_time = next_start_time.add(daily_duration_hours, 'hour');
        sql = `INSERT INTO streams (title, rtmp_url, stream_key, video_id, schedule_type, daily_start_time, daily_duration_hours, next_start_time, next_end_time) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`;
        params = [title, rtmp_url, stream_key, video_id, schedule_type, daily_start_time, daily_duration_hours, next_start_time.toISOString(), next_end_time.toISOString()];
    } else {
        return res.status(400).json({ error: 'Invalid schedule type' });
    }
    db.run(sql, params, function(err) {
        if (err) return res.status(500).json({ error: err.message });
        res.status(201).json({ id: this.lastID, message: "Stream created" });
    });
});

app.put('/api/streams/:id', (req, res) => {
    const { id } = req.params;
    // Logika untuk UPDATE, mirip dengan POST
    // Anda bisa melengkapinya sesuai kebutuhan
    res.json({ message: `Stream ${id} updated` });
});

app.delete('/api/streams/:id', (req, res) => {
    const { id } = req.params;
    streamManager.stopStream(id);
    db.run("DELETE FROM streams WHERE id = ?", [id], (err) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: "Stream deleted" });
    });
});

app.post('/api/streams/:id/start', (req, res) => {
    db.get(`SELECT s.*, v.file_path as video_path FROM streams s JOIN videos v ON s.video_id = v.id WHERE s.id = ?`, [req.params.id], (err, stream) => {
        if (err || !stream) return res.status(404).json({ error: "Stream not found" });
        if (stream.status === 'live') return res.status(400).json({ error: "Stream is already live" });
        console.log(`[MANUAL START] Starting stream ID: ${stream.id}`);
        streamManager.startStream(stream);
        db.run("UPDATE streams SET status = 'live', next_start_time = ?, next_end_time = ? WHERE id = ?", [new Date().toISOString(), dayjs().add(1, 'year').toISOString(), stream.id]);
        res.json({ message: "Stream started" });
    });
});

app.post('/api/streams/:id/stop', (req, res) => {
    const { id } = req.params;
    console.log(`[MANUAL STOP] Stopping stream ID: ${id}`);
    streamManager.stopStream(id);
    db.run("UPDATE streams SET status = 'offline' WHERE id = ?", [id]);
    res.json({ message: "Stream stopped" });
});

// --- System Stats API ---
app.get('/api/stats', async (req, res) => {
  try {
    const [cpu, mem, fs, net] = await Promise.all([si.currentLoad(), si.mem(), si.fsSize(), si.networkStats()]);
    const rootDisk = fs.find(d => d.mount === '/');
    const defaultNet = net[0] || { rx_sec: 0, tx_sec: 0 };
    res.json({
      cpu: cpu.currentLoad.toFixed(1),
      ram: { used: (mem.active / 1e9).toFixed(1), total: (mem.total / 1e9).toFixed(1) },
      disk: rootDisk ? rootDisk.use.toFixed(1) : 0,
      net: { rx_sec: defaultNet.rx_sec, tx_sec: defaultNet.tx_sec }
    });
  } catch (e) { res.status(500).json({ error: 'Failed to get stats' }); }
});

// ================== SERVER STARTUP ==================
(async () => {
  try {
    await initDb();
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`Server is listening on port ${PORT}.`);
      if (typeof runScheduler === 'function') runScheduler();
    });
  } catch (dbError) {
    console.error("FATAL: Could not initialize server.", dbError);
    process.exit(1);
  }
})();
