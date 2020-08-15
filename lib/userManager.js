const _ = require('lodash');
const bcrypt = require('bcrypt');
const Models = require('funsociety-bookshelf-model-loader');

const config = require('../config');

const _keyLength = config.userManager.keyLength;

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
    async create(nick, email, password, host) {
        const passwordHash = await bcrypt.hash(password, _keyLength);
        return await Models.Users.create({
            nick,
            email,
            host,
            password: passwordHash,
        });
    }

    /**
     * Verify A User
     * @param nick
     * @param password
     * @returns {Promise<boolean|void|*>}
     */
    async verify(nick, password) {
        if (!nick || !password) return false;

        const result = await Models.Users
            .where('nick', 'like', nick)
            .fetch();

        if (!result) throw new Error(t('libraries:userDoesNotExist'));
        return bcrypt.compare(result.attributes.password, password);
    }

    /**
     * Get a User by Nickname
     * @param nick
     * @returns {Promise<*>}
     */
    async getByNick(nick) {
        return (!nick || !_.isString(nick) || _.isEmpty(nick)) ? null : Models.Users.where('nick', '=', nick).fetch();
    }
}

module.exports = UserManager;
