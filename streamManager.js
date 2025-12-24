// streamManager.js
const { spawn } = require('child_process');

// Objek untuk menyimpan referensi ke proses FFmpeg yang sedang berjalan
const activeStreams = {};

const startStream = (stream) => {
  if (activeStreams[stream.id]) {
    console.log(`Stream ${stream.id} is already running.`);
    return;
  }

  const rtmpEndpoint = `${stream.rtmp_url}/${stream.stream_key}`;

  const ffmpegArgs = [
    '-re',
    '-stream_loop', '-1',
    '-i', stream.video_path,
    '-c:v', 'copy',
    '-c:a', 'copy',
    '-f', 'flv',
    rtmpEndpoint,
  ];

  console.log(`Starting FFmpeg for stream ${stream.id}: ffmpeg ${ffmpegArgs.join(' ')}`);

  const ffmpegProcess = spawn('ffmpeg', ffmpegArgs, { detached: true });
  activeStreams[stream.id] = ffmpegProcess;

  ffmpegProcess.stderr.on('data', (data) => {
    console.error(`FFMPEG stderr ${stream.id}: ${data.toString()}`);
  });

  ffmpegProcess.on('close', (code) => {
    console.log(`FFmpeg process for stream ${stream.id} exited with code ${code}`);
    delete activeStreams[stream.id];
  });
};

const stopStream = (streamId) => {
  const process = activeStreams[streamId];
  if (process) {
    console.log(`Stopping stream ${streamId} with SIGTERM.`);
    process.kill('SIGTERM');
    delete activeStreams[streamId];
  } else {
    console.log(`No active stream process found for ID ${streamId}.`);
  }
};

module.exports = { startStream, stopStream, activeStreams };
