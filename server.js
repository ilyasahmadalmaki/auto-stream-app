// server.js
require('dotenv').config();
const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const dayjs = require('dayjs');
const { db, initDb } = require('./db');
const { runScheduler } = require('./scheduler');
const { activeStreams } = require('./streamManager');

const app = express();
const PORT = process.env.PORT || 7000;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public')); // Sajikan file statis dari folder public

// Buat folder videos jika belum ada
const videoDir = path.join(__dirname, 'videos');
if (!fs.existsSync(videoDir)) {
  fs.mkdirSync(videoDir);
}

// Konfigurasi Multer untuk upload video lokal
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'videos/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + '-' + file.originalname);
  }
});
const upload = multer({ storage: storage });

// ====== API ROUTES ======

// VIDEO GALLERY API
app.get('/api/videos', (req, res) => {
  db.all("SELECT * FROM videos ORDER BY created_at DESC", [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

app.post('/api/videos/upload', upload.single('videoFile'), (req, res) => {
  const { title } = req.body;
  const file = req.file;
  if (!file) return res.status(400).json({ error: 'No file uploaded.' });

  const sql = `INSERT INTO videos (title, file_path, source_type, file_size) VALUES (?, ?, ?, ?)`;
  const params = [title, file.path, 'local', file.size];
  
  db.run(sql, params, function (err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ message: 'Video uploaded successfully', videoId: this.lastID });
  });
});

// STREAMING API
app.get('/api/streams', (req, res) => {
    const sql = `
        SELECT s.*, v.title as video_title FROM streams s
        JOIN videos v ON s.video_id = v.id
        ORDER BY s.created_at DESC
    `;
    db.all(sql, [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        
        const streamsWithStatus = rows.map(row => ({
            ...row,
            is_process_running: !!activeStreams[row.id]
        }));
        
        res.json(streamsWithStatus);
    });
});

app.post('/api/streams', (req, res) => {
  const { title, stream_key, video_id, schedule_type, start_datetime, end_datetime, daily_start_time, daily_duration_hours } = req.body;
  const rtmp_url = process.env.YOUTUBE_RTMP_URL;

  let sql, params;
  let next_start_time, next_end_time;
  
  if (schedule_type === 'once') {
    next_start_time = dayjs(start_datetime).toISOString();
    next_end_time = dayjs(end_datetime).toISOString();
    sql = `INSERT INTO streams (title, rtmp_url, stream_key, video_id, schedule_type, start_time, end_time, next_start_time, next_end_time) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`;
    params = [title, rtmp_url, stream_key, video_id, schedule_type, start_datetime, end_datetime, next_start_time, next_end_time];
  } else if (schedule_type === 'daily') {
    const [hour, minute] = daily_start_time.split(':');
    let now = dayjs();
    next_start_time = now.hour(hour).minute(minute).second(0);
    
    if (next_start_time.isBefore(now)) {
        next_start_time = next_start_time.add(1, 'day');
    }
    
    next_end_time = next_start_time.add(daily_duration_hours, 'hour');

    sql = `INSERT INTO streams (title, rtmp_url, stream_key, video_id, schedule_type, daily_start_time, daily_duration_hours, next_start_time, next_end_time) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`;
    params = [title, rtmp_url, stream_key, video_id, schedule_type, daily_start_time, daily_duration_hours, next_start_time.toISOString(), next_end_time.toISOString()];
  } else {
    return res.status(400).json({ error: 'Invalid schedule type.' });
  }

  db.run(sql, params, function (err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ message: 'Stream scheduled successfully', streamId: this.lastID });
  });
});

// Serve video files for preview
app.get('/videos/:filename', (req, res) => {
    const filePath = path.join(__dirname, 'videos', req.params.filename);
    if (fs.existsSync(filePath)) {
        res.sendFile(filePath);
    } else {
        res.status(404).send('Video not found');
    }
});

// Inisialisasi DB dan jalankan server
(async () => {
  await initDb();
  
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server is listening on port ${PORT}.`);
    console.log(`To access from another device on the same network, use your local IP.`);
    console.log(`On a VPS, use http://<YOUR_VPS_IP>:${PORT}`);
    
    runScheduler();
  });
})();
