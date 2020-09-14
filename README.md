# discord-among-us
Setup instructions to be updated later.

Rough setup instructions:
1. Authorize Discord bot with the following permissions:

2. Create .env file in root folder (same folder as bot.js) with the following contents:
DISCORD_TOKEN=<replace this with your discord token>

3. Create roles: crewmate and ghost

4. Update config.json with ids based on your server. The structure of config.json is as follows
(reminder JSON is finicky and may complain about extra commas):
{
  "<your server/guild id>": { 
    "discordPrefix": "<can be changed to whatever you'd like",
    "roleIds": {
      "crewmate": "<id of crewmate role>",
      "ghost": "<id of ghost role>"
    },
    "defaultVoiceChannel": "<id of default voice channel to move people to>",
    "defaultGameCategory": "<category id of default game to use>",
    "<category id of game>": {
      "voiceChannelIds": {
        "table": "<id of discussion channel for game>",
        "ghosts": "<id of ghosts channel for game>"
      },
      "reactions": {
        "channelId": "<id of text channel for reactions to control game>",
        "joinGame": "<id of message for reacting to join game>",
        "addGhost": "<id of message for reacting to turn ghost>",
        "mute": "<id of message for reacting to mute game>"
      }
    },
    "<optional category id of different game>": {
      "voiceChannelIds": {
        "table": "<id of discussion channel for game>",
        "ghosts": "<id of ghosts channel for game>"
      },
      "reactions": {
        "channelId": "<id of text channel for reactions to control game>",
        "joinGame": "<id of message for reacting to join game>",
        "addGhost": "<id of message for reacting to turn ghost>",
        "mute": "<id of message for reacting to mute game>"
      }
    },
  }
}