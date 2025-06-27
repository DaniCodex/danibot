import fetch from 'node-fetch';
import fs from 'fs';

let config = {};

try {
  config = JSON.parse(fs.readFileSync('./config.json', 'utf8'));
  console.log('[DaniBot] config.json cargado correctamente');
} catch (err) {
  console.warn('[DaniBot] config.json no encontrado, usando variables de entorno');
}

// Valores desde config.json o .env (si no existe config.json)
const YOUTUBE_CHANNEL_ID = config.youtubeChannelId || process.env.YOUTUBE_CHANNEL_ID;
const DISCORD_WEBHOOK_URL = config.discordWebhookUrl || process.env.DISCORD_WEBHOOK_URL;
const CHECK_INTERVAL = config.checkInterval || process.env.CHECK_INTERVAL || 300000;

const YT_FEED_URL = `https://www.youtube.com/feeds/videos.xml?channel_id=${YOUTUBE_CHANNEL_ID}`;
const lastVideoPath = './lastVideo.json';

// Crear lastVideo.json si no existe
if (!fs.existsSync(lastVideoPath)) {
  fs.writeFileSync(lastVideoPath, JSON.stringify({ videoId: '' }));
}

async function checkYouTube() {
  const res = await fetch(YT_FEED_URL);
  const xml = await res.text();
  const match = xml.match(/<yt:videoId>(.*?)<\/yt:videoId>/);
  const latestVideoId = match?.[1];

  if (!latestVideoId) return;

  const lastData = JSON.parse(fs.readFileSync(lastVideoPath, 'utf8'));

  if (latestVideoId !== lastData.videoId) {
    const titleMatch = xml.match(/<title>(.*?)<\/title>/);
    const videoTitle = titleMatch?.[1] || 'Nuevo video';

    await fetch(DISCORD_WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: 'DaniBot 🤖',
        avatar_url: 'https://i.imgur.com/yourbotavatar.png',
        content: `📢 ¡Nuevo video en el canal!\n🎬 **${videoTitle}**\n🔗 https://youtu.be/${latestVideoId}`
      })
    });

    fs.writeFileSync(lastVideoPath, JSON.stringify({ videoId: latestVideoId }));
    console.log(`[DaniBot] Nuevo video detectado: ${videoTitle}`);
  }
}

setInterval(checkYouTube, CHECK_INTERVAL);
console.log('[DaniBot] Bot iniciado. Escaneando cada ' + CHECK_INTERVAL / 1000 + ' segundos...');

console.log("🔧 ENV YOUTUBE_CHANNEL_ID:", process.env.YOUTUBE_CHANNEL_ID);
console.log("🔧 ENV DISCORD_WEBHOOK_URL:", process.env.DISCORD_WEBHOOK_URL);
console.log("🔧 ENV CHECK_INTERVAL:", process.env.CHECK_INTERVAL);
