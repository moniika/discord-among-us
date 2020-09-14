// Run dotenv
require('dotenv').config();

// Import libraries
const {Client, MessageAttachment, MessageEmbed} = require('discord.js');

const client = new Client({
  partials: ['MESSAGE', 'REACTION'],
  ws: {
    intents: ['GUILDS', 'GUILD_MEMBERS', 'GUILD_MESSAGES',
      'GUILD_MESSAGE_REACTIONS','GUILD_PRESENCES', 'GUILD_VOICE_STATES']
    }
});

require('./handlers/ready.js')(client);
require('./handlers/message.js')(client);
require('./handlers/voiceStateUpdate.js')(client);
require('./handlers/guildMemberUpdate.js')(client);
require('./handlers/messageReactionAdd.js')(client);
require('./handlers/messageReactionRemove.js')(client);

// Initialize bot by connecting to the server
client.login(process.env.DISCORD_TOKEN).catch(console.error);
