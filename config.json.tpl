{
  "<your server/guild id>": { 
    "discordPrefix": "<can be changed to whatever you'd like, recommended: ! or .>",
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
    }
  }
}