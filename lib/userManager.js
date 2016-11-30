'use strict';
const Models = require('bookshelf-model-loader');
const config = require('../config');

const scrypt = require('scrypt');
const scryptParameters = {
    N: 16,
    r: 1,
    p: 1
};

const _salt = new Buffer(config.userManager.salt);
const _keyLength = config.userManager.keyLength;

class UserManager {
    constructor() {}

    // Properties

    // Methods

    // Create a new user
    create(nick, email, password, host) {
        return scrypt.hash(new Buffer(password), scryptParameters, _keyLength, _salt)
            .then(passwordHash => {
                return Models.Users.create({
                    nick: nick,
                    email: email,
                    host: host,
                    password: passwordHash.toString('base64')
                });
            });
    }

    // Verify the credentials of a user
    verify(nick, password) {
        return Models.Users
            .query(qb => {
                qb.where('nick', nick);
            })
            .fetch()
            .then(result => {
                return new Promise((resolve, reject) => {
                    if (!result) resolve(t('libraries:userDoesNotExist'));
                    else return scrypt.hash(password, scryptParameters, _keyLength, _salt)
                        .then(hash => {
                            resolve(hash.toString('base64') === result.attributes.password);
                        });
                });
            });
    }

    // Update the users host
    updateHost(nick, host) {}

}

module.exports = UserManager;
