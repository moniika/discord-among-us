const config = require ('../config');
const { memberLog } = require ('../utils/shared.js');

/**
 * Voice channel string id.
 * @typedef {ChannelStr}
 */
const channels = {
  TABLE: 'table',
  GHOSTS: 'ghosts',
};

/**
 * Gets category id of voice channel.
 * @param {!VoiceState} voice The voice to get category from.
 * @returns {?Snowflake} The category containing the voice channel the voice state is in.
 */
const getCategoryIdFromVoice = (voice) => {
  if (!voice.channel) return null;
  return voice.channel.parentID;
};

/**
 * Returns whether the given voice state is server muted.
 * @param {!VoiceState} voice The voice state to check.
 * @returns {boolean} Whether the voice state is server muted.
 */
const isVoiceMuted = (voice) => {
  return voice.serverMute;
};

/**
 * Returns whether the given member is server muted.
 * @param {!GuildMember} voice The member to check.
 * @returns {boolean} Whether the member is server muted.
 */
const isMemberMuted = (member) => {
  return isVoiceMuted(member.voices);
};

/**
 * Sets the server mute state for the given voice state.
 * @param {!GuildMember} voice The voice state.
 * @param {boolean} mute Whether to mute.
 */
const setVoiceMute = (voice, mute) => {
  voice.setMute(mute);
};

/**
 * Sets the server mute state for the given member.
 * @param {!GuildMember} member The guild member.
 * @param {boolean} mute Whether to mute.
 */
const setMemberMute = (member, mute) => {
  setVoiceMute(member.voice, mute);
};

/**
 * Gets voice channel id from config.json file for the specified guild and category.
 * @param {!Snowflake} guildId The guild id.
 * @param {!Snowflake} categoryId The category id.
 * @param {ChannelStr} channelStr The channel string.
 * @returns {!Snowflake} The voice channel id or null if not found.
 * @private
 */
const getVoiceChannelId = (guildId, categoryId, channelStr) => {
  const gameCategoryConfig = config[guildId][categoryId];
  if (!gameCategoryConfig) return null;
  return gameCategoryConfig['channelIds'][channelStr];
};

/**
 * Gets voice channel for the specified guild and category.
 * @param {!Guild} guild The guild.
 * @param {!Snowflake} categoryId The category id.
 * @param {!ChannelStr} channelStr The channel string.
 * @returns {?VoiceChannel} The voice channel or null if not found.
 * @private
 */
const getVoiceChannel = (guild, categoryId, channelStr) => {
  const channelId = getVoiceChannelId(guild.id, categoryId, channelStr);
  if (!channelId) return null;
  return guild.channels.cache.get(channelId);
};

/**
 * Executes function for all members in specified voice channel.
 * @param {!Guild} guild The guild.
 * @param {!Snowflake} categoryId The category id.
 * @param {!ChannelStr} channelStr The channel string.
 * @param {!function(!GuildMember)} func The func to call on each member.
 */
const forAllInVoiceChannel = (guild, categoryId, channelStr, func) => {
  const channel = getVoiceChannel(guild, categoryId, channelStr);
  if (!channel) {
    console.error('Could not find channel');
    return;
  }
  channel.members.forEach(func);
};

/**
 * Returns whether the given voice state is connected to a voice channel.
 * @param {!VoiceState} voice The voice state to check.
 * @returns {boolean} Whether the voice state is connected to a voice channel.
 */
const isVoiceConnected = (voice) => {
  return !!voice.channelID
};

/**
 * Returns whether the given member is connected to a voice channel.
 * @param {!GuildMember} member The member to check.
 * @returns {boolean} Whether the member is connected to a voice channel.
 */
const isMemberOnVoice = (member) => {
  return isVoiceConnected(member.voice);
};

/**
 * Tries to move given member to game voice channel.
 * @param {!GuildMember} member The member to move.
 * @param {!ChannelStr} channelStr The channel string.
 * @private
 */
const tryMoveGameVoiceChannel = (member, channelStr) => {
  if (!isMemberOnVoice(member)) return;
  const categoryId = getCategoryIdFromVoice(member.voice);
  const serverConfig = config[member.guild.id];
  // If member is not in game category, use default game category.
  const defaultCategoryId = serverConfig['defaultGameCategory'];
  console.log(categoryId);
  const gameConfig =
      serverConfig[categoryId] || serverConfig[defaultCategoryId];
  const targetChannelId = gameConfig['channelIds'][channelStr];
  if (member.voice.channelID != targetChannelId) {
    member.voice.setChannel(targetChannelId).then(() => {
      memberLog(member, 'moved to ' + channelStr, true);
    }).catch(console.error);
  }
};

/**
 * Tries to move given member to discussion table voice channel.
 * @param {!GuildMember} member The member to move.
 */
const tryMoveTableVoiceChannel = (member) => {
  tryMoveGameVoiceChannel(member, channels.TABLE);
};

/**
 * Tries to move given member to ghosts voice channel.
 * @param {!GuildMember} member The member to move.
 */
const tryMoveGhostsVoiceChannel = (member) => {
  tryMoveGameVoiceChannel(member, channels.GHOSTS);
};

/**
 * Tries to move given member to default voice channel.
 * @param {!GuildMember} member The member to move.
 */
const tryMoveDefaultVoiceChannel = (member) => {
  if (!isMemberOnVoice(member)) return;
  const serverConfig = config[member.guild.id];
  const targetChannelId = serverConfig['defaultVoiceChannel'];
  if (member.voice.channelID != targetChannelId) {
    member.voice.setChannel(targetChannelId).then(() => {
      memberLog(member, 'moved to default', true);
    }).catch(console.error);
  }
};

/**
 * Returns whether the given member is in a ghosts voice channel.
 * @param {!GuildMemeber} vmemberoice The member to check.
 * @returns {boolean} Whether the member is in ghosts channel.
 */
const isInGhostsVoice = (member) => {
  if (!isMemberOnVoice(member)) return false;
  const categoryId = getCategoryIdFromVoice(member.voice);
  if (!categoryId) return false;
  const ghostsChannelid = getVoiceChannelId(member.guild.id, categoryId, channels.TABLE);
  return member.voice.channelID == ghostsChannelid;
  
};

 /**
 * Returns whether the given voice state is in a discussion table voice channel.
 * @param {!VoiceState} voice The voice state to check.
 * @returns {boolean} Whether the member is in discussion table channel.
 */
const isVoiceInDiscussion = (voice) => {
  if (!isVoiceConnected(voice)) return false;
  const categoryId = getCategoryIdFromVoice(voice);
  if (!categoryId) return false;
  const discussionChannelId = getVoiceChannelId(voice.guild.id, categoryId, channels.TABLE);
  return voice.channelID == discussionChannelId;  
};

module.exports = {
  channels,
  forAllInVoiceChannel,
  getCategoryIdFromVoice,
  isInGhostsVoice,
  isMemberMuted,
  isMemberOnVoice,
  isVoiceConnected,
  isVoiceInDiscussion,
  isVoiceMuted,
  setVoiceMute,
  setMemberMute,
  tryMoveDefaultVoiceChannel,
  tryMoveGhostsVoiceChannel,
  tryMoveTableVoiceChannel,
};
