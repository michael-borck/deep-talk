#!/usr/bin/env node

const https = require('https');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// FFmpeg download URLs (using ffmpeg-static npm package URLs)
const FFMPEG_URLS = {
  darwin: 'https://github.com/eugeneware/ffmpeg-static/releases/download/b6.0/ffmpeg-darwin-x64.gz',
  win32: 'https://github.com/eugeneware/ffmpeg-static/releases/download/b6.0/ffmpeg-win32-x64.exe.gz',
  linux: 'https://github.com/eugeneware/ffmpeg-static/releases/download/b6.0/ffmpeg-linux-x64.gz'
};

const download = (url, dest) => {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(dest);
    https.get(url, response => {
      response.pipe(file);
      file.on('finish', () => {
        file.close(resolve);
      });
    }).on('error', err => {
      fs.unlink(dest, () => {});
      reject(err);
    });
  });
};

const downloadFFmpeg = async () => {
  console.log('Downloading FFmpeg binaries...');
  
  for (const [platform, url] of Object.entries(FFMPEG_URLS)) {
    const fileName = platform === 'win32' ? 'ffmpeg.exe.gz' : 'ffmpeg.gz';
    const gzPath = path.join(__dirname, '..', 'ffmpeg-binaries', platform, fileName);
    const binPath = gzPath.replace('.gz', '');
    
    // Skip if already exists
    if (fs.existsSync(binPath)) {
      console.log(`✓ FFmpeg for ${platform} already exists`);
      continue;
    }
    
    console.log(`Downloading FFmpeg for ${platform}...`);
    
    try {
      // Download
      await download(url, gzPath);
      
      // Decompress
      execSync(`gunzip -f "${gzPath}"`);
      
      // Make executable (Unix platforms)
      if (platform !== 'win32') {
        fs.chmodSync(binPath, 0o755);
      }
      
      console.log(`✓ Downloaded FFmpeg for ${platform}`);
    } catch (error) {
      console.error(`✗ Failed to download FFmpeg for ${platform}:`, error.message);
    }
  }
  
  console.log('FFmpeg download complete!');
};

// Run if called directly
if (require.main === module) {
  downloadFFmpeg().catch(console.error);
}

module.exports = { downloadFFmpeg };