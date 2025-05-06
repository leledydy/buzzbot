require('dotenv').config();
const { Client, GatewayIntentBits } = require('discord.js');
const axios = require('axios');

// Fetch the environment variables for security (don't hardcode your keys in production)
const token = process.env.DISCORD_TOKEN;
const newsApiKey = process.env.NEWSDATA_API_KEY;

// Replace this with the target channel ID
const TARGET_CHANNEL_ID = '1366821107797069924'; // <-- Replace with your channel ID

// Create a new Discord client
const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent],
});

// Fetch cryptocurrency news
async function fetchCryptoNews() {
  try {
    const response = await axios.get('https://newsdata.io/api/1/crypto', {
      params: {
        apikey: newsApiKey,
        q: 'bitcoin', // You can change this query to get news about other cryptocurrencies
        language: 'en',
      },
    });
    return response.data.results;
  } catch (error) {
    console.error('Error fetching news:', error);
    return null;
  }
}

// Command handler for the !cryptonews command
client.on('messageCreate', async (message) => {
  if (message.content.toLowerCase() === '!cryptonews') {
    const news = await fetchCryptoNews();

    if (news && news.length > 0) {
      const newsEmbed = {
        color: 0x0099ff,
        title: 'Latest Cryptocurrency News',
        description: 'Here are the latest headlines in the crypto world!',
        fields: news.slice(0, 5).map((item) => ({
          name: item.title,
          value: item.description || 'No description available',
        })),
        timestamp: new Date(),
      };

      // Send the message to the specific channel by ID
      const channel = await client.channels.fetch(TARGET_CHANNEL_ID);
      if (channel) {
        channel.send({ embeds: [newsEmbed] });
      } else {
        console.error('Channel not found!');
      }
    } else {
      console.log('No news available!');
    }
  }
});

// Log in to Discord with your app's token
client.login(token);
