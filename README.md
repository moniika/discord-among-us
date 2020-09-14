## Among Us Discord bot

This is a Discord bot for managing voice chats during games of Among Us.

Using either reactions or bot commands though Discord text channel, you can easily mute/unmute while playing Among Us.
If desired, you can also set players as ghosts so that when the discussion channel is muted, all the ghosts get moved to their own voice chat to talk and are moved back, and muted, when disussion is un-muted.

## Prerequisites

- Basic understanding of **JavaScript**
- Basic knowledge on using your terminal (mac/linux) or command line (windows)
- Installed [Node JS](https://nodejs.org/en/) installed. (v8.0.0 or above)
- And a [Discord](https://discordapp.com/) account and desktop client (obviously…)

## Setup Instructions

### Discord server setup

- Create a ghost and crewmate role in your Discord channel
- Create a new category to hold your game channels and add the following channels:
  - Text channel "#game" and inside this channel create the following messages and **pin them**:
    - A message for joining the game
    - A message for becoming a ghost
    - A message for muting/unmuting the discussion table
  - Voice channel "Around the Table"
  - Voice channel "Ghosts" and optionally set permissions @everyone (View Channel: false) and ghost role (View Channel: true)

### Code setup

- Open your terminal and navigate to the root folder of the project
- Install pre-requisites by doing `npm i` or `npm install` in the terminal
- Generate your access token via [Discord App Developers portal](https://discordapp.com/developers/applications/).
- In the project folder, duplicate the `.env.tpl` and rename it to `.env` then open it and add the generated token (from previous step) value there
- In the project folder, duplicate the `config.json.tpl` and rename it to `config.json` and fill it out with desired prefix for commands, and ids for your Discord server

### Adding bot to your server

- In the [Discord App Developers portal](https://discordapp.com/developers/applications/) go to Bot and enable "Presence intent" and "Server members intent"
- Additionally, go to OAuth2
  - select 'bot' scope
  - and select the permissions: 'manage roles', 'send messages', 'manage messages', 'read message history', 'add reactions', 'mute members', and 'move members'
  - and copy the authorization url and add the bot to your Discord server

## Starting the bot

Simply run the command `npm run start`

### Bot commands

- Use the command: `<discord prefix you set in config>help` to get a message describing bot commands.
- There are a few commands not described in the help message and you can explore the source code under `handlers/message.js` to find them.
- The help message can be disabled by setting `"enableHelpCmd"` in `config.json` to `false`

## Advanced add-ons

- This bot supports config for multiple game categories. To do so, follow the setup of creating additional category and channels and add the ids to config. Example:
```
{
  "<your server/guild id>": { 
    ...
    "<first game category>": {
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
    "<additional game category>": {
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
    }
  }
}
```
- In theory, this bot also supports multiple server/guilds but has not been thoroughly tested
