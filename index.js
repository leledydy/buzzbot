require('dotenv').config();
const { Client, GatewayIntentBits } = require('discord.js');
const axios = require('axios');

const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages],
});

const CHANNEL_ID = process.env.CHANNEL_ID;

let sentLinks = new Set();

async function fetchNewsData() {
  try {
    const res = await axios.get('https://newsdata.io/api/1/news', {
      params: {
        apikey: process.env.NEWSDATA_API_KEY,
        q: 'crypto OR bitcoin OR ethereum',
        language: 'en',
        category: 'business',
      },
    });

    const article = res.data.results?.[0];
    return article ? {
      title: article.title,
      url: article.link,
      description: article.description,
      image: article.image_url || null,
      source: 'NewsData.io'
    } : null;
  } catch (err) {
    console.error('NewsData error:', err.message);
    return null;
  }
}

async function fetchGNews() {
  try {
    const res = await axios.get('https://gnews.io/api/v4/search', {
      params: {
        q: 'crypto',
        token: process.env.GNEWS_API_KEY,
        lang: 'en',
        max: 1,
      },
    });

    const article = res.data.articles?.[0];
    return article ? {
      title: article.title,
      url: article.url,
      description: article.description,
      image: article.image,
      source: 'GNews'
    } : null;
  } catch (err) {
    console.error('GNews error:', err.message);
    return null;
  }
}

async function fetchCurrents() {
  try {
    const res = await axios.get('https://api.currentsapi.services/v1/latest-news', {
      params: {
        apiKey: process.env.CURRENTS_API_KEY,
        category: 'cryptocurrency',
        language: 'en',
      },
    });

    const article = res.data.news?.[0];
    return article ? {
      title: article.title,
      url: article.url,
      description: article.description,
      image: article.image || null,
      source: 'CurrentsAPI'
    } : null;
  } catch (err) {
    console.error('Currents error:', err.message);
    return null;
  }
}

async function fetchAndSendNews() {
  const channel = await client.channels.fetch(CHANNEL_ID);
  const sources = [fetchNewsData, fetchGNews, fetchCurrents];

  for (const fetchFn of sources) {
    const article = await fetchFn();
    if (article && !sentLinks.has(article.url)) {
      const embed = {
        color: 0x00ccff,
        title: article.title,
        url: article.url,
        description: article.description?.slice(0, 200) || 'No description.',
        footer: { text: `Source: ${article.source}` },
        timestamp: new Date(),
        thumbnail: article.image ? { url: article.image } : undefined,
      };

      await channel.send({ embeds: [embed] });
      sentLinks.add(article.url);
    }
  }
}

client.once('ready', () => {
  console.log(`✅ Logged in as ${client.user.tag}`);
  fetchAndSendNews(); // Run immediately
  setInterval(fetchAndSendNews, 6 * 60 * 60 * 1000); // Every 6 hours
});

client.login(process.env.DISCORD_TOKEN);
