const { memberLog } = require ('../utils/shared.js');
const { hasGhostRole, hasPlayerRole, unkillPlayer } = require ('../utils/role.js');
const {
  isMemberMuted, setMemberMute, tryMoveDefaultVoiceChannel,
  tryMoveTableVoiceChannel
} = require ('../utils/voice.js');
const {
  tryRemoveMemberGhostReaction, tryRemoveMemberJoinReaction
} = require ('../utils/reactions.js');
const { isDiscussionOpen } = require ('../utils/discussion.js');

/**
 * Handles when a player role is added to a guild member.
 * @param {!GuildMember} member The guild member.
 */
const onPlayerJoin = (member) => {
  memberLog(member, 'joined the game');
  tryMoveTableVoiceChannel(member);
};
/**
 * Handles when a player role is removed from a guild member.
 * @param {!GuildMember} member The guild member.
 */
const onRemovePlayer = (member) => {
  memberLog(member, 'removed from the game');
  if (hasGhostRole(member)) {
    memberLog(member, 'removed ghost role from onRemovePlayer', true);
    unkillPlayer(member);
  }
  tryMoveDefaultVoiceChannel(member);
  tryRemoveMemberJoinReaction(member);
  tryRemoveMemberGhostReaction(member);
};
/**
 * Handles when a ghost role is added to a guild member.
 * @param {!GuildMember} member The guild member.
 */
const onPlayerDeath = async (member)  => {
  memberLog(member, 'killed');
  if (await isDiscussionOpen(member.guild.id)) {
    // Mutes ghost.
    setMemberMute(member, true);
  }
};
/**
 * Handles when a ghost role is removed from a guild member.
 * @param {!GuildMember} member The guild member.
 */
const onPlayerDeathUndo = (member) => {
  memberLog(member, 'un-killed');
  if (isMemberMuted(member)) {
    // The only time member is expected to be muted is when they are ghost
    // in discussion voice chat. Ergo, unmute non-ghost if muted.
    setMemberMute(member, false);
  }
  if (isInGhostsVoice(member)) {
    tryMoveTableVoiceChannel(member);
  }
  tryRemoveMemberGhostReaction(member);
};

module.exports = (client) => { 
  // Event listener for when a guild member is updated (including role change).
  client.on('guildMemberUpdate', (oldMember, newMember) => {
    const wasPlayer = hasPlayerRole(oldMember);
    const isPlayer = hasPlayerRole(newMember);
    const wasGhost = hasGhostRole(oldMember);
    const isGhost = hasGhostRole(newMember);
    memberLog(newMember, 'wasPlayer: ' + wasPlayer + ' isPlayer: ' + isPlayer +
        ' wasGhost: ' + wasGhost + ' isGhost: ' + isGhost)
    if (!wasPlayer && isPlayer) {  // Added player role.
      onPlayerJoin(newMember);
    } else if (wasPlayer && !isPlayer) {  // Removed player role.
      onRemovePlayer(newMember);
    } else if (!wasGhost && isGhost) {  // Added ghost role.
      onPlayerDeath(newMember);
    } else if (wasGhost && !isGhost) {  // Removed ghost role.
      onPlayerDeathUndo(newMember);
    }
  });
};
