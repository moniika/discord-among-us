const config = require ('../config');
const { forEachGameCategoryConfig, log, handlePartialMsg } = require ('../utils/shared.js');
const {
  addPlayer, clearGameRoles, hasRole, killPlayer, removePlayer, resetGameRoles,
  unkillPlayer,
} = require ('../utils/role.js');
const {
  endDiscussion, resetDiscussion, startDiscussion
} = require ('../utils/discussion.js');
const { resetGameMsgReactions } = require('../utils/reactions.js');
const { MessageEmbed } = require('discord.js');

/**
 * Sends a help message to the specified channel.
 * @param {!TextChannel} channel The channel to send the message to.
 */
const sendHelpMessage = (channel) => {
  const discordPrefix = config[channel.guild.id]['discordPrefix'];
  const embed = new MessageEmbed()
      // Set the title of the field
      .setTitle('Lets play Among Us!')
      // Set the color of the embed
      .setColor(0x00ffff)
      // Set the main content of the embed
      .setDescription(
      `**To join the Game**
      - Connect to Around the Table voice chat AND
      - React with \:thumbsup: to the pinned message (in #game) OR
      - Use bot command: ${discordPrefix}join or ${discordPrefix}play
      
      **During the game**
      - Don't forget to mute the disussion table when you're not around the button
      - React with \:mute: or \:sound: to the pinned message (in #game) to mute/unmute discussion OR
      - Use bot commmands: ${discordPrefix}quiet or ${discordPrefix}mute to mute and ${discordPrefix}discuss or ${discordPrefix}unmute to unmute (in #game)
      
      **When you become a sad ghost**
      - React with \:ghost: to the pinned message (in #game) OR
      - Use bot command: ${discordPrefix}rip or ${discordPrefix}iamdead
      - When the discussion voice chat is muted, you will be automatically moved to Ghosts voice chat where you can freely chat.
      - When the discussion voice chat is un-muted, you will be automatically moved to (and muted in) the discussion chat so you can listen in.
      
      **To restart the game**
      - Use ${discordPrefix}restart to remove all ghost roles for users in the current game (use in #game)
      - Use ${discordPrefix}reset to remove all game roles.
      
      **Other bot commands**
      - ${discordPrefix}kill @user -> sets ghost role for mentioned user(s)
      - ${discordPrefix}unkill @user -> unsets ghost role for mentioned user(s)
      - ${discordPrefix}clear -> clears unpinned messages (use in #game)
      - ${discordPrefix}add @user -> Adds all mentioned users to the game`);
  channel.send(embed);
};

/**
 * Resets the game state for all games.
 * @param {!Guild} guild The guild the game is in.
 * @param {!Snowflake} categoryId The categoryId of the game.
 */
const resetAllGames = (guild) => {
  clearGameRoles(guild);
  forEachGameCategoryConfig(guild.id, (categoryId) => {
    resetGameMsgReactions(guild, categoryId);
    resetDiscussion(guild, categoryId);    
  });
  log(guild.id + ' all games reset');
};

/**
 * Clears non-pinned messages from text channel.
 * @param {!TextChannel} channel The channel to clear.
 */
const clearTextChannel = (channel) => {
  channel.messages.fetch({limit: 99}).then(messages => {
    const getUnpinned = messages.filter(message => !message.pinned);
    channel.bulkDelete(getUnpinned)
    log(channel.id + ' has been cleared');
  }).catch(console.error);
};

/**
 * Restarts the game state for specified game.
 * @param {!Guild} guild The guild the game is in.
 * @param {!Snowflake} categoryId The categoryId of the game.
 */
const restartGame = (guild, categoryId) => {
  resetGameRoles(guild, categoryId);
  resetGameMsgReactions(guild, categoryId);
  resetDiscussion(guild, categoryId);
  log(categoryId + ' game restarted');
};

/** 
 * Returns whether the specified guild id and category id is a game in config.
 * @param {!Snowflake} guildId The guild id.
 * @param {!Snowflake} categoryId The category
 * @returns {boolean} Whether the member has the role.
 */
const isGame = (guildId, categoryId) => {
  return !!config[guildId][categoryId];
};

const handleCommand = (command, msg, client) => {
  const categoryId = msg.channel.parentID;
  command = command.toLowerCase();
  
  let deleteMsg = false;
  switch(command) {
    case 'explain':
    case 'help':
      let helpCmdEnabled = config[msg.guild.id]['enableHelpCmd'];
      if (helpCmdEnabled == 'true') {
        sendHelpMessage(msg.channel);
        deleteMsg = true;
      }
      break;
    case 'reset':
      resetAllGames(msg.guild);
      deleteMsg = true;
      break; 
    case 'join':
    case 'play':
      addPlayer(msg.member, categoryId);
      deleteMsg = true;
      break;
    case 'add':
      msg.mentions.members.forEach(member => {
        addPlayer(member, categoryId);
      });
      deleteMsg = true;
      break;
    case 'leave':
      removePlayer(msg.member);
      deleteMsg = true;
      break;      
    case 'remove':
      msg.mentions.members.forEach(member => {
        removePlayer(member);
      });
      deleteMsg = true;
      break;
    case 'iamdead':
    case 'rip':
    case 'dead':
    case 'ghost':
      killPlayer(msg.member, categoryId);
      deleteMsg = true;
      break; 
    case 'kill':
      msg.mentions.members.forEach(member => {
        killPlayer(member, categoryId);
      });
      deleteMsg = true;
      break;
    case 'unkill':
      msg.mentions.members.forEach(member => {
        unkillPlayer(member, categoryId);
      });
      deleteMsg = true;
      break;
  } 
  if (isGame(msg.guild.id, categoryId)) {
    // Handle commands that only work within a game text channel.
    switch(command) {
      case 'restart':
        restartGame(msg.guild, categoryId);
        deleteMsg = true;
        break;
      case 'clear':
        // Delete msg before clearing channel.
        deleteMsg = false;
        msg.delete().then(() => {
          clearTextChannel(msg.channel);
        }).catch(console.error);
        break;
      case 'mute':
      case 'quiet':
        endDiscussion(msg.guild, categoryId);
        deleteMsg = true;
        break;
      case 'unmute':
      case 'discuss':
        startDiscussion(msg.guild, categoryId);
        deleteMsg = true;
        break;
    } 
  }
  if (deleteMsg) {
    msg.delete().catch(console.error);
  }
};

module.exports = (client) => { 
  // Event listener for when a message is sent.
  client.on('message', (msg) => { 
    if (!handlePartialMsg(msg)) {
      return;
    }
    const discordPrefix = config[msg.guild.id]['discordPrefix'];
    if (!msg.content.startsWith(discordPrefix)) return;
    const withoutPrefix = msg.content.slice(discordPrefix.length);
    const command = withoutPrefix.split(/ +/)[0];
    handleCommand(command, msg);
  });
};
