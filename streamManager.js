// streamManager.js (Versi Final)
const { spawn } = require('child_process');

// Objek untuk menyimpan referensi ke proses FFmpeg yang sedang berjalan
// Kunci adalah ID stream, nilainya adalah proses yang di-spawn
const activeStreams = {};

const startStream = (stream) => {
  // Pencegahan agar tidak memulai stream yang sama dua kali
  if (activeStreams[stream.id]) {
    console.log(`[StreamManager] Attempted to start stream ${stream.id}, but it is already running.`);
    return;
  }

  const rtmpEndpoint = `${stream.rtmp_url}/${stream.stream_key}`;

  const ffmpegArgs = [
    '-re',                      // Baca input pada kecepatan native (real-time)
    '-stream_loop', '-1',       // Looping video tanpa henti
    '-i', stream.video_path,    // Path ke file video input
    '-c:v', 'copy',             // Salin stream video tanpa re-encode
    '-c:a', 'copy',             // Salin stream audio tanpa re-encode
    '-f', 'flv',                // Format output untuk RTMP
    rtmpEndpoint,
  ];

  console.log(`[StreamManager] Spawning FFmpeg for stream ${stream.id}: ffmpeg ${ffmpegArgs.join(' ')}`);

  const ffmpegProcess = spawn('ffmpeg', ffmpegArgs, {
    // Jalankan proses secara detached agar tidak terikat dengan proses utama Node.js
    detached: true, 
    // Abaikan output stdout dan stderr dari proses child agar tidak membanjiri log utama
    stdio: 'ignore' 
  });

  // Simpan referensi proses
  activeStreams[stream.id] = ffmpegProcess;

  // Hapus referensi ketika proses selesai
  ffmpegProcess.on('close', (code) => {
    console.log(`[StreamManager] FFmpeg process for stream ${stream.id} exited with code ${code}.`);
    delete activeStreams[stream.id];
  });
  
  // Lepaskan proses child dari parent agar bisa terus berjalan jika parent crash
  ffmpegProcess.unref();
};

const stopStream = (streamId) => {
  const process = activeStreams[streamId];
  if (process) {
    console.log(`[StreamManager] Sending SIGTERM to stop stream ${streamId}.`);
    // Gunakan SIGTERM untuk menghentikan proses secara "sopan"
    process.kill('SIGTERM'); 
    delete activeStreams[streamId];
  } else {
    console.log(`[StreamManager] No active stream process found for ID ${streamId} to stop.`);
  }
};

const streamManager = {
    startStream,
    stopStream,
    activeStreams
};

module.exports = { streamManager };
