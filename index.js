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
        q: 'cryptocurrency OR bitcoin OR ethereum OR altcoin OR defi',
        language: 'en',
        category: 'technology',
      },
    });

    const article = res.data.results?.[0];
    return article ? {
      title: article.title,
      url: article.link,
      description: article.description,
      image: article.image_url || null,
      source: 'NewsData.io',
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
        q: 'cryptocurrency OR bitcoin OR ethereum OR blockchain',
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
      source: 'GNews',
    } : null;
  } catch (err) {
    console.error('GNews error:', err.message);
    return null;
  }
}

async function fetchCurrents() {
  try {
    const res = await axios.get('https://api.currentsapi.services/v1/search', {
      params: {
        apiKey: process.env.CURRENTS_API_KEY,
        keywords: 'cryptocurrency, bitcoin, ethereum, blockchain',
        language: 'en',
      },
    });

    const article = res.data.news?.[0];
    return article ? {
      title: article.title,
      url: article.url,
      description: article.description,
      image: article.image || null,
      source: 'CurrentsAPI',
    } : null;
  } catch (err) {
    console.error('Currents error:', err.message);
    return null;
  }
}

async function fetchAndSendNews() {
  const channel = await client.channels.fetch(CHANNEL_ID);
  const sources = [fetchNewsData, fetchGNews, fetchCurrents];
  let articlesSent = 0;
  const maxArticles = 3;

  for (const fetchFn of sources) {
    if (articlesSent >= maxArticles) break;

    const article = await fetchFn();
    if (article && !sentLinks.has(article.url)) {
      const embed = {
        color: 0x00ccff,
        title: article.title,
        url: article.url,
        description: `[Click to read full article](${article.url})\n\n${article.description?.slice(0, 200) || 'No description.'}`,
        image: article.image ? { url: article.image } : undefined,
        footer: { text: `Source: ${article.source}` },
        timestamp: new Date(),
      };

      await channel.send({ embeds: [embed] });
      sentLinks.add(article.url);
      articlesSent++;
    }
  }

  if (articlesSent === 0) {
    console.log("ℹ️ No new crypto news to post.");
  } else {
    console.log(`📤 Posted ${articlesSent} crypto news article(s).`);
  }
}

client.once('ready', () => {
  console.log(`✅ Logged in as ${client.user.tag}`);
  fetchAndSendNews(); // Run once on startup
  setInterval(fetchAndSendNews, 6 * 60 * 60 * 1000); // Every 6 hours
});

client.login(process.env.DISCORD_TOKEN);
