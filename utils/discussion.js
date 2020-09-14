const { log } = require ('../utils/shared.js');
const { hasGhostRole } = require ('../utils/role.js');
const {
  channels, forAllInVoiceChannel, isMemberMuted, setMemberMute,
  tryMoveGhostsVoiceChannel, tryMoveTableVoiceChannel,
} = require ('../utils/voice.js');

// Setup in-memory storage.
const Keyv = require('keyv');
const discussionState = new Keyv({namespace: 'discussionState'});
discussionState.on('error', err => console.error('Keyv connection error:', err));

/**
 * Returns whether discussion is curently open.
 * @param {!Snowflake} categoryId The category id of game to check.
 * @returns {boolean} Whether the discussion is open.
 */
const isDiscussionOpen = async (categoryId) => {
  const discussionOpen = await discussionState.get(categoryId);
  if (discussionOpen === undefined) return true;  // default to true
  return discussionOpen;
};

/**
 * Sets the state of discussion.
 * @param {!Snowflake} categoryId The category id of game to set.
 * @param {boolean} isOpen Whether to set the discussion to open (true) or
 *    closed (false).
 * @returns {boolean} Whether the discussion is open.
 */
const setDiscussionOpen = async (categoryId, isOpen) => {
  await discussionState.set(categoryId, isOpen);
};

/**
 * Handles opening discussion.
 * @param {!Guild} guild The guild the game is in.
 * @param {!Snowflake} categoryId The category id of game.
 */
const startDiscussion = async (guild, categoryId) => {
  if (await isDiscussionOpen(categoryId)) {
    // Discussion is already un-muted.
    return;
  }
  forAllInVoiceChannel(guild, categoryId, channels.TABLE, (member) => {
    if (!hasGhostRole(member)) {
      // Un-mute non-ghosts
      setMemberMute(member, false);
    }
  });
  forAllInVoiceChannel(guild, categoryId, channels.GHOSTS, (member) => {
    // Move ghosts to ghosts voice channel when discussion starts.
    // voiceStateUpdate should mute them as they come in.
    tryMoveTableVoiceChannel(member, categoryId);
  });
  log(categoryId + 'opened the floor for discussion');
  setDiscussionOpen(categoryId, true);
};

/**
 * Handles closing discussion.
 * @param {!Guild} guild The guild the game is in.
 * @param {!Snowflake} categoryId The category id of game.
 */
const endDiscussion = async (guild, categoryId) => {
  if (!await isDiscussionOpen(categoryId)) {
    // Discussion is already muted.
    return;
  }
  forAllInVoiceChannel(guild, categoryId, channels.TABLE, (member) => {
    if (hasGhostRole(member)) {
      // Move ghosts to ghosts voice channel when discussion ends.
      tryMoveGhostsVoiceChannel(member, categoryId);
    } else {
      // Mute everyone else.
      setMemberMute(member, true);
    }
  });
  log(categoryId + ' ended discussion');
  setDiscussionOpen(categoryId, false);
};

/**
 * Resets discussion state.
 * @param {!Guild} guild The guild the game is in.
 * @param {!Snowflake} categoryId The category id of game.
 */
const resetDiscussion = (guild, categoryId) => {
  setDiscussionOpen(categoryId, true);
  forAllInVoiceChannel(guild, categoryId, channels.TABLE, (member) => {
    if (isMemberMuted(member)) {
      // Un-mute everyone
      setMemberMute(member, false);
    }
  });
};

module.exports = {
  endDiscussion,
  isDiscussionOpen,
  resetDiscussion,
  setDiscussionOpen,
  startDiscussion,
};
