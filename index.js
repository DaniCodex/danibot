import fetch from 'node-fetch';
import fs from 'fs';

const config = JSON.parse(fs.readFileSync('./config.json', 'utf8'));

const YT_FEED_URL = `https://www.youtube.com/feeds/videos.xml?channel_id=${config.youtubeChannelId}`;

async function checkYouTube() {
  const res = await fetch(YT_FEED_URL);
  const xml = await res.text();
  const match = xml.match(/<yt:videoId>(.*?)<\/yt:videoId>/);
  const latestVideoId = match?.[1];

  if (!latestVideoId) return;

  const lastData = JSON.parse(fs.readFileSync('./lastVideo.json', 'utf8'));

  if (latestVideoId !== lastData.videoId) {
    const titleMatch = xml.match(/<title>(.*?)<\/title>/);
    const videoTitle = titleMatch?.[1] || 'Nuevo video';

    await fetch(config.discordWebhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: 'DaniBot 🤖',
        avatar_url: 'https://i.imgur.com/yourbotavatar.png',
        content: `📢 ¡Nuevo video en el canal!\n🎬 **${videoTitle}**\n🔗 https://youtu.be/${latestVideoId}`
      })
    });

    fs.writeFileSync('./lastVideo.json', JSON.stringify({ videoId: latestVideoId }));
    console.log(`[DaniBot] Nuevo video detectado: ${videoTitle}`);
  }
}

setInterval(checkYouTube, config.checkInterval);
console.log('[DaniBot] Bot iniciado. Esperando nuevos videos...');
