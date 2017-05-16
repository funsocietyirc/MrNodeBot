'use strict';
const Models = require('bookshelf-model-loader');
const config = require('../config');
const _ = require('lodash');

const scrypt = require('scrypt');
const scryptParameters = {
    N: 16,
    r: 1,
    p: 1
};

const _salt = new Buffer(config.userManager.salt);
const _keyLength = config.userManager.keyLength;

class UserManager {
    constructor() {
    }

    // Properties

    // Methods

    // Create a new user
    //noinspection JSMethodCanBeStatic
    async create(nick, email, password, host) {
        const passwordHash = await scrypt.hash(new Buffer(password), scryptParameters, _keyLength, _salt);

        return await Models.Users.create({
            nick: nick,
            email: email,
            host: host,
            password: passwordHash.toString('base64')
        });

    }

    // Verify the credentials of a user
    //noinspection JSMethodCanBeStatic
    async verify(nick, password) {
        if (!nick || !password) return false;

        const result = await Models.Users
            .where('nick', 'like', nick)
            .fetch();

        if (!result) throw new Error(t('libraries:userDoesNotExist'));

        const hash = await scrypt.hash(password, scryptParameters, _keyLength, _salt);

        if (!hash) throw new Error('Something went wrong verifying your account');

        return hash.toString('base64') === result.attributes.password;
    }

    // Update the users host
    //noinspection JSMethodCanBeStatic
    async updateHost(nick, host) {
    }

    // Get Users by Nick
    // TODO Test
    //noinspection JSMethodCanBeStatic
    async getByNick(nick, callback) {
        const callbackProvided = _.isFunction(callback);

        if (!nick || !_.isString(nick) || _.isEmpty(nick)) return callbackProvided ? callback(null) : null;

        try {
            const result = await Models.Users.where('nick', '=', nick).fetch();
            return callbackProvided ? callback(result) : result;
        }
        catch (err) {
            return callbackProvided ? callback(null) : null;
        }
    }

    // // Fetch a user
    // getByNick(nick, callback) {
    //     if (!nick || !_.isString(nick) || _.isEmpty(nick)) return callback(null);
    //     return Models.Users.where('nick', '=', nick).fetch().then(result => callback(result)).catch(e => callback(null));
    // }

}

module.exports = UserManager;
