require('dotenv').config(); // ✅ Load .env variables first

const { Client, GatewayIntentBits } = require('discord.js'); // ✅ Import Discord.js
const axios = require('axios'); // ✅ For fetching news

// ✅ Your environment variables
const token = process.env.DISCORD_TOKEN;
const newsApiKey = process.env.NEWSDATA_API_KEY;

// ✅ Replace with your real channel ID
const TARGET_CHANNEL_ID = '1366821107797069924';

// ✅ Create Discord client with required intents
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

// ✅ When the bot is ready
client.once('ready', () => {
  console.log(`✅ Logged in as ${client.user.tag}`);
});

// ✅ Fetch news from NewsData.io
async function fetchCryptoNews() {
  try {
    const response = await axios.get('https://newsdata.io/api/1/news', {
      params: {
        apikey: newsApiKey,
        q: 'crypto OR bitcoin OR ethereum',
        language: 'en',
        category: 'business',
      },
    });

    return response.data.results || [];
  } catch (error) {
    console.error('❌ Error fetching news:', error);
    return null;
  }
}

// ✅ Respond to command
client.on('messageCreate', async (message) => {
  if (message.author.bot) return;

  if (message.content.toLowerCase() === '!cryptonews') {
    const news = await fetchCryptoNews();

    if (news && news.length > 0) {
      const newsEmbed = {
        color: 0x0099ff,
        title: '📰 Latest Crypto News',
        description: 'Here are the latest headlines:',
        fields: news.slice(0, 5).map((item) => ({
          name: item.title,
          value: item.link,
        })),
        timestamp: new Date(),
      };

      try {
        const channel = await client.channels.fetch(TARGET_CHANNEL_ID);
        if (channel) {
          channel.send({ embeds: [newsEmbed] });
        } else {
          message.channel.send('❌ Could not find the target channel.');
        }
      } catch (err) {
        console.error('❌ Channel fetch/send failed:', err);
        message.channel.send('❌ Failed to send news.');
      }
    } else {
      message.channel.send('😕 No news found.');
    }
  }
});

// ✅ Log in
client.login(token);
