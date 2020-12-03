const { memberLog } = require ('../utils/shared.js');
const { hasGhostRole } = require ('../utils/role.js');
const {
  getCategoryIdFromVoice, getVoiceChannel, isVoiceInDiscussion, isVoiceMuted,
  setVoiceMute
} = require ('../utils/voice.js');
const { isDiscussionOpen } = require ('../utils/discussion.js');

module.exports = (client) => { 
  // Event listener for when a voice state changes.
  client.on('voiceStateUpdate', async (oldState, newState) => {
    if (oldState.channelID != newState.channelID) {
      // If channel has changed.
      const member = newState.member;
      if (isVoiceInDiscussion(newState)) {
        // If going to the discussion voice channel.
        const categoryId = getCategoryIdFromVoice(newState);
        if (!await isDiscussionOpen(categoryId) || hasGhostRole(member)) {
          // Mute if discussion is closed or if member is ghost.
          setVoiceMute(newState, true);
          memberLog(member, 'muted as they entered discussion voice', true);
        } else if (isVoiceMuted(newState) && await isDiscussionOpen(categoryId)) {
          // Un-mute if muted and discussion is open.
          setVoiceMute(newState, false);
          memberLog(member, 'unmuted as they entered discussion voice', true);
        }
      } else if (isVoiceMuted(newState) && newState.channelID) {
        // Un-mute if muted and not in discussion.
        setVoiceMute(newState, false);
        memberLog(member, 'unmuted', true);
      }
    }
  });
};
