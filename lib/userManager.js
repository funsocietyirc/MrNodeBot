const _ = require('lodash');
const bcrypt = require('bcryptjs');
const Models = require('funsociety-bookshelf-model-loader');
const t = require('./localize');
const logger = require('./logger');

const config = require('../config');

const _keyLength = config.userManager.keyLength; // Legacy scrypt key length; not valid bcrypt cost rounds.
// const _bcryptRounds = _keyLength;
const _configuredBcryptRounds = config.userManager.bcryptRounds;
const _bcryptRounds = (_.isInteger(_configuredBcryptRounds) && _configuredBcryptRounds >= 4 && _configuredBcryptRounds <= 15) ? _configuredBcryptRounds : 10; // bcryptjs expects cost rounds; keyLength=64 would stall.

if (_bcryptRounds !== _configuredBcryptRounds) {
    logger.warn('User Manager bcryptRounds config invalid, falling back to 10', {
        configuredBcryptRounds: _configuredBcryptRounds,
        legacyKeyLength: _keyLength,
    });
}

/**
 * User Manager
 */
class UserManager {
    /**
     * Create A User
     * @param nick
     * @param email
     * @param password
     * @param host
     * @returns {Promise<*>}
     */
    // static async create(nick, email, password, host) {
    async create(nick, email, password, host) { // Instance method because bot.js stores new UserManager() on app._userManager.
        logger.info('User Manager Trace: create called', {
            nick,
            email,
            host: host || '',
            hasPassword: !!password,
        });
        // const passwordHash = await bcrypt.hash(password, _keyLength);
        const passwordHash = await bcrypt.hash(password, _bcryptRounds); // Use bcryptRounds because legacy keyLength=64 is a scrypt value.
        logger.info('User Manager Trace: password hash complete', {
            nick,
        });
        logger.info('User Manager Trace: creating user model', {
            nick,
            email,
            host: host || '',
        });
        const user = await Models.Users.create({
            nick,
            email,
            host,
            password: passwordHash,
        });
        logger.info('User Manager Trace: user model created', {
            nick,
            id: user && user.id ? user.id : '',
        });
        return user;
    }

    /**
     * Verify A User
     * @param nick
     * @param password
     * @returns {Promise<boolean|void|*>}
     */
    // static async verify(nick, password) {
    async verify(nick, password) { // Instance method because web/server.js calls app._userManager.verify().
        if (!nick || !password) return false;

        const result = await Models.Users
            .where('nick', 'like', nick)
            .fetch();

        if (!result) throw new Error(t('libraries:userDoesNotExist'));
        // return bcrypt.compare(result.attributes.password, password);
        return bcrypt.compare(password, result.attributes.password); // bcrypt.compare expects plaintext first, stored hash second.
    }

    /**
     * Get a User by Nickname
     * @param nick
     * @returns {Promise<*>}
     */
    // static async getByNick(nick) {
    async getByNick(nick) { // Instance method because web/server.js calls app._userManager.getByNick().
        return (!nick || !_.isString(nick) || _.isEmpty(nick)) ? null : Models.Users.where('nick', '=', nick).fetch();
    }
}

module.exports = UserManager;
