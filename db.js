// db.js (Versi Final)
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Menentukan path database di direktori yang sama dengan file ini
const dbPath = path.resolve(__dirname, 'database.sqlite');

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('FATAL: Error opening database', err.message);
    // Jika koneksi DB gagal, aplikasi tidak bisa berjalan.
    process.exit(1); 
  } else {
    console.log('Successfully connected to the SQLite database.');
  }
});

const initDb = () => {
  return new Promise((resolve, reject) => {
    db.serialize(() => {
      // Tabel untuk menyimpan metadata video
      db.run(`
        CREATE TABLE IF NOT EXISTS videos (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          title TEXT NOT NULL,
          file_path TEXT NOT NULL UNIQUE,
          source_type TEXT CHECK(source_type IN ('local', 'gdrive')) NOT NULL,
          file_size INTEGER,
          duration REAL,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `, (err) => {
        if (err) return reject(err);
      });

      // Tabel untuk menyimpan jadwal dan status stream
      db.run(`
        CREATE TABLE IF NOT EXISTS streams (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          title TEXT NOT NULL,
          rtmp_url TEXT NOT NULL,
          stream_key TEXT NOT NULL,
          video_id INTEGER NOT NULL,
          schedule_type TEXT CHECK(schedule_type IN ('once', 'daily')) NOT NULL,
          
          start_time DATETIME,
          end_time DATETIME,
          
          daily_start_time TEXT, -- format "HH:MM"
          daily_duration_hours INTEGER,
          
          next_start_time DATETIME,
          next_end_time DATETIME,
          
          status TEXT CHECK(status IN ('scheduled', 'live', 'offline')) NOT NULL DEFAULT 'scheduled',
          
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          
          FOREIGN KEY (video_id) REFERENCES videos (id) ON DELETE CASCADE
        )
      `, (err) => {
        if (err) return reject(err);
        console.log('Database tables are ready.');
        resolve();
      });
    });
  });
};

module.exports = { db, initDb };
