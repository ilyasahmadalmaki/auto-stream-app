// db.js
const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./database.sqlite', (err) => {
  if (err) {
    console.error('Error opening database', err.message);
  } else {
    console.log('Connected to the SQLite database.');
  }
});

const initDb = () => {
  db.serialize(() => {
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
    `);

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
        
        daily_start_time TEXT,
        daily_duration_hours INTEGER,
        
        next_start_time DATETIME,
        next_end_time DATETIME,
        
        status TEXT CHECK(status IN ('scheduled', 'live', 'offline')) NOT NULL DEFAULT 'scheduled',
        
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        
        FOREIGN KEY (video_id) REFERENCES videos (id)
      )
    `);

    console.log('Database tables are ready.');
  });
};

module.exports = { db, initDb };
