const { handleReactionChange } = require ('../utils/reactions.js');
const {
  hasGhostRole, hasPlayerRole, removePlayer, unkillPlayer
  } = require ('../utils/role.js');

module.exports = async (client) => {
  // Event listener for when a reaction is removed.
  client.on('messageReactionRemove', async (messageReaction, user) => {
    handleReactionChange(messageReaction, user,
    (member) => {
      if (hasPlayerRole(member)) {
        removePlayer(member);
      }
    },
    (member) => {
      if (hasGhostRole(member)) {
        unkillPlayer(member);
      }
    }, false);
  })
};
