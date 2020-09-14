const config = require('../config');
const { log, memberLog } = require('../utils/shared.js');
const { getCategoryIdFromVoice }  = require('../utils/voice.js');
const {
  isMemberMuted, setMemberMute, tryMoveDefaultVoiceChannel,
  tryMoveTableVoiceChannel,
} = require ('../utils/voice.js');

/**
 * Role string id.
 * @typedef {RoleStr}
 * @private
 */
const roles = {
  CREWMATE: 'crewmate',
  GHOST: 'ghost',
};

/**
 * Gets role id from config.json file.
 * @param {!Snowflake} guildId The guild id.
 * @param {!RoleStr} roleStr the role string.
 * @returns {Snowflake} The role id.
 * @private
 */
const getRoleId = (guildId, roleStr) => {
  return config[guildId]['roleIds'][roleStr];
};

/**
 * Returns whether the given member has the specified role assigned. 
 * @param {!GuildMember} member The guild member to check.
 * @param {!RoleStr} roleStr The role string of the role to check for.
 * @returns {boolean} Whether the member has the role.
 * @private
 */
const hasRole = (member, roleStr) => {
  return member.roles.cache.has(getRoleId(member.guild.id, roleStr));
};

/**
 * Returns whether the given member has a ghost role assigned. 
 * @param {!GuildMember} member The guild member to check.
 * @returns {boolean} Whether the member has a ghost role.
 */
const hasGhostRole = (member) => {
  return hasRole(member, roles.GHOST);
};

/**
 * Returns whether the given member has a player role assigned. 
 * @param {!GuildMember} member The guild member to check.
 * @returns {boolean} Whether the member has a player role.
 */
const hasPlayerRole = (member) => {
  return hasRole(member, roles.CREWMATE);
};

/**
 * Adds player role to member and moves to discussion voice channel. 
 * @param {!GuildMember} member The guild member to add role to.
 * @param {!Snowflake} categoryId The category id.
 */
const addPlayer = (member, categoryId) => {
  if (hasPlayerRole(member)) {
    memberLog(member, 'already part of the crew');
    return;
  }
  member.roles.add(getRoleId(member.guild.id, roles.CREWMATE)).catch(console.error);
  tryMoveTableVoiceChannel(member, categoryId);
};

/**
 * Removes player role from member and moves to default voice channel. 
 * @param {!GuildMember} member The guild member to add role to.
 */
const removePlayer = (member) => {
  if (!hasPlayerRole(member)) {
    memberLog(member, 'was not crewmate... what happened here?', true);
    return;
  }
  member.roles.set([]).catch(console.error);
  tryMoveDefaultVoiceChannel(member);
};

/**
 * Adds ghost role to member, if they have player role as well. 
 * @param {!GuildMember} member The guild member to add role to.
 * @param {!Snowflake} categoryId The category id.
 */
const killPlayer = (member, categoryId) => {
  if (!hasPlayerRole(member)) {
    memberLog(member, 'ignoring non-player kill');
    return;
  }
  if (hasGhostRole(member)) {
    memberLog(member, 'already dead');
    return;
  }
  member.roles.add(getRoleId(member.guild.id, roles.GHOST)).catch(console.error);
};

/**
 * Removes ghost role from specified member. 
 * @param {!GuildMember} member The guild member to add role to.
 */
const removeGhost = (member) => {
  if (!hasGhostRole(member)) {
    memberLog(member, 'was not ghost... what happened here?', true);
    return;
  }
  member.roles.remove(getRoleId(member.guild.id, roles.GHOST)).catch(console.error);
};

/**
 * Removes ghost role from player and moves to discussion voice channel.
 * @param {!GuildMember} member The guild member to add role to.
 * @param {!Snowflake} categoryId The category id.
 */
const unkillPlayer = (member, categoryId) => {
  removeGhost(member);
  tryMoveTableVoiceChannel(member, categoryId);
};

/**
 * Executes function on each member with the specified role.
 * @param {!Guild} guild The guild containing the players.
 * @param {!Snowflake} roleId The role id of the role to look for.
 * @param {!function(!GuildMember)} func The func to call on each member.
 * @private
 */
const forEachWithRole = (guild, roleId, func) => {
  const membersWithRole = guild.roles.cache.get(roleId).members;
  membersWithRole.forEach(func);
};

/**
 * Executes function on each member with the specified roles.
 * @param {!Guild} guild The guild containing the players.
 * @param {Array<!Snowflake>} roleIds An array of role ids to look for.
 * @param {!function(!GuildMember)} func The func to call on each member.
 * @private
 */
const forEachWithRoles = (guild, roleIds, func) => {
  roleIds.forEach(roleId => {
    forEachWithRole(guild, roleId, func);
  });
};

/**
 * Clears game roles for all members in the specified guild.
 * @param {!Guild} guild The guild containing the members.
 */
const clearGameRoles = (guild) => {
  const crewRoleId = getRoleId(guild.id, roles.CREWMATE);
  const ghostRoleId = getRoleId(guild.id, roles.GHOST);
  const gameRoles = [crewRoleId, ghostRoleId];
  forEachWithRoles(guild, gameRoles, (member) => {
    member.roles.remove(gameRoles).catch(console.error);
    tryMoveDefaultVoiceChannel(member);
  });
  // Notes: remove is async, so roles may not yet all be cleared.
  log('Cleared roles', true);
};

/**
 * Removes ghost role from all members in the specified category.
 * @param {!Guild} guild The guild containing the category.
 * @param {!Snowflake} categoryId The id of the category containing the members.
 */
const resetGameRoles = (guild, categoryId) => {
  const ghostRoleId = getRoleId(guild.id, roles.GHOST);
  forEachWithRole(guild, ghostRoleId, (member) => {
    const currCategoryId = getCategoryIdFromVoice(member.voice);
    if (currCategoryId == categoryId) {
      unkillPlayer(member);
    }
  });
  log('All roles in categoryId:' + categoryId + ' have been reset', true);
};

module.exports = {
  addPlayer,
  clearGameRoles,
  hasGhostRole,
  hasPlayerRole,
  killPlayer,
  removeGhost,
  removePlayer,
  resetGameRoles,
  unkillPlayer,
};
