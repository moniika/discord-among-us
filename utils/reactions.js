const config = require ('../config');
const {
  forEachGameCategoryConfig, getMemberFromUser, handlePartialMsg,
  handlePartialReaction
} = require ('../utils/shared.js');
const { startDiscussion, endDiscussion } = require ('../utils/discussion.js');

// Helpers for emoji
const getEmoji = (messageReaction) => {
  return messageReaction.emoji.id || messageReaction.emoji.name;
};
const ghostEmoji = '👻';
const isGhostReaction = (messageReaction) => {
  return getEmoji(messageReaction) == ghostEmoji;
};
const joinEmoji = '👍';
const isJoinReaction = (messageReaction) => { 
  return getEmoji(messageReaction) == joinEmoji;
};

const muteEmoji = '🔇';
const isMuteReaction = (messageReaction) => { 
  return getEmoji(messageReaction) == muteEmoji;
}
const unMuteEmoji = '🔉';
const isUnMuteReaction = (messageReaction) => { 
  return getEmoji(messageReaction) == unMuteEmoji;
}

/**
 * Game reaction message string id.
 * @typedef {MessageStr}
 */
const reactionsMsgs = {
  JOIN: 'joinGame',
  GHOST: 'addGhost',
  MUTE: 'mute',
};

/**
 * Gets reaction messge id from config.json file.
 * @param {!Snowflake} guildId The guild id.
 * @param {!Snowflake} categoryId The category id.
 * @param {MessageStr} messageStr The message string.
 * @returns {!Snowflake} The message id.
 * @private
 */
const getReactionMessageId = (guildId, categoryId, messageStr) => {
  const gameCategoryConfig = config[guildId][categoryId];
  return gameCategoryConfig['messageIds'][messageStr];
};

/**
 * Handles reaction change.
 * @param {!MessageReaction} messageReaction The reaction.
 * @param {!User} user The user that triggered the reaction.
 * @param {!function(!GuildMember)} onJoin Function to trigger if the reaction
 *    is on a join message.
 * @param {!function(!GuildMember)} onGhost Function to trigger if the reaction
 *    is on a ghost message.
 * @param {boolean} isAdd Whether a reaction was added (true) or removed (false).
 */
const handleReactionChange = async (messageReaction, user, onJoin, onGhost, isAdd) => {
  if (!handlePartialReaction(messageReaction) || user.bot || user.system ||
      messageReaction.message.channel.type !== 'text') {
    return;
  }
  const message = messageReaction.message;
  if (!handlePartialMsg(message)) {
    return;
  }
  const guild = message.channel.guild;
  const categoryId = message.channel.parentID;
  const gameConfig = config[guild.id][categoryId];
  if (!gameConfig) return;
  const reactionConfig = gameConfig['reactions'];
  const joinGameMsgId = reactionConfig['joinGame'];
  const addGhostMsgId = reactionConfig['addGhost'];
  const muteMsgId = reactionConfig['mute'];
  if (message.id == joinGameMsgId && isJoinReaction(messageReaction)) {
    const member  = await getMemberFromUser(user, guild);
    onJoin(member, categoryId);
  } else if (message.id == addGhostMsgId && isGhostReaction(messageReaction)) {
    const member = await getMemberFromUser(user, guild);
    onGhost(member, categoryId);
  } else if (isAdd && message.id == muteMsgId) {
    messageReaction.users.remove(user);
    if (isUnMuteReaction(messageReaction)) {
      startDiscussion(guild, categoryId);
    } else if (isMuteReaction(messageReaction)) {
      endDiscussion(guild, categoryId)
    }
  }
};

/**
 * Adds bot emojis.
 * @param {!Message} joinGameMsg The join game message.
 * @param {!Message} addGhostMsg The ghost message.
 * @param {!Message} muteMsg The mute message.
 */
const addEmojisToMsgs = async (joinGameMsg, addGhostMsg, muteMsg) => {
  await addGhostMsg.react(ghostEmoji);
  await joinGameMsg.react(joinEmoji);
  await muteMsg.react(unMuteEmoji);
  await muteMsg.react(muteEmoji);
};

/**
 * Resets game role reactions for specified game.
 * @param {!Guild} guild The guild containing the game.
 * @param {!Snowflake} categoryId The category id of the game.
 */
const resetGameMsgReactions = async (guild, categoryId) => {
  const reactionConfig = config[guild.id][categoryId]['reactions'];
  const gameChannelId = reactionConfig['channelId'];
  const gameChannel = guild.channels.cache.get(gameChannelId);
  const joinGameMsg = gameChannel.messages.cache.get(reactionConfig['joinGame']);
  const addGhostMsg = gameChannel.messages.cache.get(reactionConfig['addGhost']);
  const muteMsg = gameChannel.messages.cache.get(reactionConfig['mute']);
  joinGameMsg.reactions.removeAll();
  addGhostMsg.reactions.removeAll();
  muteMsg.reactions.removeAll();
  // Re-add bot emojiis
  await addEmojisToMsgs(joinGameMsg, addGhostMsg, muteMsg);
};

/**
 * Tries to remove a member's reaction for all game text channels.
 * @param {!Guild} guild The guild containing the games.
 * @param {MessageStr} messageStr The message string of what type of message
 *    to remove reaction from.
 * @param {string} emoji The emoji to remove.
 * @private
 */
const tryRemoveMemberReaction = (member, messageStr, emoji) => {
  const guild = member.guild;
  forEachGameCategoryConfig(guild.id, async (_, gameConfig) => {
    const reactionConfig = gameConfig['reactions'];
    const reactionChannelId = reactionConfig['channelId'];
    const gameChannel = guild.channels.cache.get(reactionChannelId);
    const msg =  gameChannel.messages.cache.get(reactionConfig[messageStr]);
    const reaction = msg.reactions.resolve(emoji);
    if (reaction) reaction.users.remove(member.user);
  });
};

/**
 * Tries to remove the specified member's join reaction for all game text
 * channels.
 */
const tryRemoveMemberJoinReaction = (member) => {
  tryRemoveMemberReaction(member, 'joinGame', joinEmoji);
};

/**
 * Tries to remove the specified member's ghost reaction for all game text
 * channels.
 */
const tryRemoveMemberGhostReaction = (member) => {
  tryRemoveMemberReaction(member, 'addGhost', ghostEmoji);
};

/**
 * Adds bot emojis for all games in config using fetch.
 */
const addEmojiisFetch = (client) => {
  Object.keys(config).forEach(async (guildId) => {
    forEachGameCategoryConfig(guildId, async (_, gameConfig) => {
      const reactionConfig = gameConfig['reactions'];
      const reactionChannelId = reactionConfig['channelId'];
      const reactionChannel = await client.channels.fetch(reactionChannelId);
      const joinGameMsg =  await reactionChannel.messages.fetch(reactionConfig['joinGame']);
      const addGhostMsg = await reactionChannel.messages.fetch(reactionConfig['addGhost']);
      const muteMsg = await reactionChannel.messages.fetch(reactionConfig['mute']);
      await addEmojisToMsgs(joinGameMsg, addGhostMsg, muteMsg);
    });
  });
};

module.exports = {
  addEmojiisFetch,
  handleReactionChange,
  resetGameMsgReactions,
  tryRemoveMemberGhostReaction,
  tryRemoveMemberJoinReaction,
};
