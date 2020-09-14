const { handleReactionChange } = require ('../utils/reactions.js');
const {
  addPlayer, hasGhostRole, hasPlayerRole, killPlayer
} = require ('../utils/role.js');

module.exports = async (client) => {
  // Event listener for when a reaction is added.
  client.on('messageReactionAdd', async (messageReaction, user) => {
    handleReactionChange(messageReaction, user,
    (member) => {
      if (!hasPlayerRole(member)) {
        // Add player if they have not joined yet.
        addPlayer(member);
      }
    },
    (member) => {
      if (!hasPlayerRole(member)) {
        // Ignore and remove ghost reaction if user has not yet joined a game.
        messageReaction.users.remove(user);
      } else if (!hasGhostRole(member)) {
        // Kill if not already dead.
        killPlayer(member);
      }
    }, true);
  });
};
