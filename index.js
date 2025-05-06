require('dotenv').config();
const { Client, GatewayIntentBits } = require('discord.js');
const axios = require('axios');

const token = process.env.DISCORD_TOKEN;
const newsApiKey = process.env.NEWSDATA_API_KEY;
const TARGET_CHANNEL_ID = '1366821107797069924'; // Replace with your real channel ID

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

let lastSentLink = ''; // Only send new unique article

async function fetchAndSendNews() {
  try {
    const res = await axios.get('https://newsdata.io/api/1/news', {
      params: {
        apikey: newsApiKey,
        q: 'crypto OR bitcoin OR ethereum',
        language: 'en',
        category: 'business',
      },
    });

    const articles = res.data.results || [];
    if (articles.length === 0) return;

    const latest = articles.find((a) => a.link !== lastSentLink);
    if (!latest) return;

    const channel = await client.channels.fetch(TARGET_CHANNEL_ID);

    const embed = {
      color: 0x00ccff,
      title: latest.title,
      url: latest.link,
      description: latest.description?.slice(0, 200) || 'No description.',
      timestamp: new Date(latest.pubDate || Date.now()),
    };

    if (latest.image_url) {
      embed.thumbnail = { url: latest.image_url };
    }

    await channel.send({ embeds: [embed] });
    lastSentLink = latest.link;

  } catch (err) {
    console.error('❌ Error sending news:', err.message);
  }
}

client.on('messageCreate', async (message) => {
  if (message.author.bot) return;
  if (message.content.toLowerCase() === '!cryptonews') {
    fetchAndSendNews();
  }
});

client.once('ready', () => {
  console.log(`✅ Logged in as ${client.user.tag}`);
  fetchAndSendNews(); // Initial post
  setInterval(fetchAndSendNews, 3600000); // Every hour
});

client.login(token);
