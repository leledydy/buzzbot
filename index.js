require('dotenv').config();
const { Client, GatewayIntentBits } = require('discord.js');
const axios = require('axios');

const token = process.env.DISCORD_TOKEN;
const newsApiKey = process.env.NEWSDATA_API_KEY;
const TARGET_CHANNEL_ID = '1366821107797069924'; // Replace this

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

const sentNews = new Set();

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

    const newsList = res.data.results || [];
    const newArticles = newsList.filter((article) => !sentNews.has(article.link));

    if (newArticles.length === 0) return;

    const channel = await client.channels.fetch(TARGET_CHANNEL_ID);

    for (const article of newArticles.slice(0, 5)) {
      const embed = {
        color: 0x00ccff,
        title: article.title,
        url: article.link,
        description: article.description?.slice(0, 200) || 'No description.',
        timestamp: new Date(article.pubDate || Date.now()),
      };

      await channel.send({ embeds: [embed] });
      sentNews.add(article.link);
    }

    // Trim memory
    if (sentNews.size > 1000) {
      const tempSet = new Set([...sentNews].slice(-500));
      sentNews.clear();
      for (const url of tempSet) sentNews.add(url);
    }

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
  fetchAndSendNews(); // Send once at startup
  setInterval(fetchAndSendNews, 3600000); // Then every hour
});

client.login(token);
