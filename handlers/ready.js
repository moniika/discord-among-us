const { log } = require ('../utils/shared.js');
const { addEmojiisFetch } = require ('../utils/reactions.js');

module.exports = (client) => { 
  // Event listener for when a user connected to the server.
  client.on('ready', () => {
    log(`Logged in as ${client.user.tag}!`);
    addEmojiisFetch(client);
  });
};
