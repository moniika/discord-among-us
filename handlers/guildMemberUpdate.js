const { memberLog } = require ('../utils/shared.js');
const { hasGhostRole, hasPlayerRole, removeGhost } = require ('../utils/role.js');
const {
  isMemberMuted, isVoiceInDiscussion, setMemberMute,
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
};
/**
 * Handles when a player role is removed from a guild member.
 * @param {!GuildMember} member The guild member.
 */
const onRemovePlayer = async (member) => {
  memberLog(member, 'removed from the game');
  if (hasGhostRole(member)) {
    memberLog(member, 'removed ghost role from onRemovePlayer', true);
    removeGhost(member);
  }
  if (isMemberMuted(member) && await isDiscussionOpen(member.guild.id)) {
    // Unmutes member if discussion is open.
    setMemberMute(member, false);
  }
  tryRemoveMemberJoinReaction(member);
  tryRemoveMemberGhostReaction(member);
};
/**
 * Handles when a ghost role is added to a guild member.
 * @param {!GuildMember} member The guild member.
 */
const onPlayerDeath = async (member)  => {
  memberLog(member, 'killed');
  if (!isMemberMuted(member) && await isDiscussionOpen(member.guild.id)) {
    // Mutes ghost.
    setMemberMute(member, true);
  }
};
/**
 * Handles when a ghost role is removed from a guild member.
 * @param {!GuildMember} member The guild member.
 */
const onPlayerDeathUndo = async (member) => {
  memberLog(member, 'un-killed');
  if (isMemberMuted(member) && await isDiscussionOpen(member.guild.id)) {
    setMemberMute(member, false);
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
        ' wasGhost: ' + wasGhost + ' isGhost: ' + isGhost, true)
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
