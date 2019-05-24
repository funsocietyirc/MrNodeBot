const Models = require('funsociety-bookshelf-model-loader');
const config = require('../config');
const _ = require('lodash');

const bcrypt = require('bcrypt');

// const _salt =  Buffer.from(config.userManager.salt);
const _keyLength = config.userManager.keyLength;

class UserManager {
    constructor() {
    }

    // Properties

    // Methods

    // Create a new user
    // noinspection JSMethodCanBeStatic
    async create(nick, email, password, host) {
        const passwordHash = await bcrypt.hash(password, _keyLength);
        return await Models.Users.create({
            nick,
            email,
            host,
            password: passwordHash,
        });
    }

    // Verify the credentials of a user
    // noinspection JSMethodCanBeStatic
    async verify(nick, password) {
        if (!nick || !password) return false;

        const result = await Models.Users
            .where('nick', 'like', nick)
            .fetch();

        if (!result) throw new Error(t('libraries:userDoesNotExist'));
        return bcrypt.compare(result.attributes.password, password)
    }

    // Update the users host
    // noinspection JSMethodCanBeStatic
    async updateUserDetails(nick, host, ident) {
    }

    // Get Users by Nick
    // TODO Test
    // noinspection JSMethodCanBeStatic
    async getByNick(nick, callback) {
        const callbackProvided = _.isFunction(callback);

        if (!nick || !_.isString(nick) || _.isEmpty(nick)) return callbackProvided ? callback(null) : null;

        try {
            const result = await Models.Users.where('nick', '=', nick).fetch();
            return callbackProvided ? callback(result) : result;
        } catch (err) {
            return callbackProvided ? callback(null) : null;
        }
    }
}

module.exports = UserManager;
