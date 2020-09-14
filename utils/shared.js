const config = require ('../config');

// For debugging, to enable verbose log.
const debuglog = true;

/**
 * Returns the specified member's display name. 
 * @param {!GuildMember} The guild member.
 * @returns {string} The display name.
 */
const getName = (member) => {
  return member.displayName;
};

/**
 * Logs message. 
 * @param {!string} content The content of the message to log.
 * @param {isDebugLog} [isDebugLog=false] Whether the log is a debug log.
 */
const log = (content, isDebugLog = false) => {
  if (!isDebugLog || debuglog) {
    console.log(content);
  }
};

/**
 * Logs message with member information. 
 * @param {!GuildMember} The guild member.
 * @param {!string} content The content of the message to log.
 * @param {isDebugLog} [isDebugLog=false] Whether the log is a debug log.
 */
const memberLog = (member, content, isDebugLog = false) => {
  if (!isDebugLog || debuglog) {
    console.log(getName(member) + ': ' + content);
  }
};

/**
 * Fetches the rest of the message if it is a partial.
 * @param {!Message} message The message to check.
 * @returns {boolean} Returns false on failure.
 */
const handlePartialMsg = async (message) => {
  if (message.partial) {
    log('Detected partial message', true);
    try {
      await message.fetch();
    } catch(err) {
      console.error(err);
      log('Something went wrong handling partial message.');
      return false;
    }
  }
  return true;
}

/**
 * Fetches the rest of the reaction if it is a partial.
 * @param {!MessageReaction} message The reaction to check.
 * @returns {boolean} Returns false on failure.
 */
const handlePartialReaction = async (reaction) => {
  if (reaction.partial) {
    log('Detected partial reaction', true);
    try {
      await reaction.fetch();
    } catch(err) {
      console.error(err);
      log('Something went wrong handling partial reaction.');
      return false;
    }
  }
  return true;
}

/**
 * Fetches member from user. 
 * @param {!User} user The user to get member information for.
 * @param {!Guild} guild The guild to get member for.
 */
const getMemberFromUser = async (user, guild) => {
  return guild.members.fetch(user);
};

/**
 * Executes function for each game category defined in config.json for
 * specified guild.
 * @param {!Snowflake} guildId The guild id containing the games.
 * @param {!function(!Snowflake, !Object)} func The function to execute for
 *    each game config found.
 */
const forEachGameCategoryConfig = (guildId, func) => {
  const serverConfig = config[guildId];
  Object.keys(serverConfig).forEach(async (key) => {
    if (isNaN(key)) return;  // Skip non-category ids.
    func(key, serverConfig[key]);
  });
};

module.exports = {
  forEachGameCategoryConfig,
  getMemberFromUser,
  getName,
  handlePartialMsg,
  handlePartialReaction,
  log,
  memberLog,
};
