'use static';
const Models = require('bookshelf-model-loader');

const scrypt = require('scrypt');
const scryptParameters = {N:16, r:1, p:1};

const _salt = new Buffer('hellofriends');
const _keyLength = 64;

class UserManager {
  constructor() {
  }

  // Properties

  // Methods
  create(nick, email, password, host) {
    return scrypt.hash(new Buffer(password),scryptParameters,_keyLength, _salt)
    .then(passwordHash => {
      return Models.Users.create({
        nick: nick,
        email: email,
        host: host,
        password: passwordHash.toString('base64')
      });
    });
  }

  verify(nick, password) {
    return Models.Users
    .query(qb => {
      qb.where('nick', nick);
    })
    .fetch()
    .then(result => {
      return new Promise((resolve, reject) => {
        scrypt.hash(password, scryptParameters,_keyLength,_salt)
        .then(hash => {
          resolve(hash.toString('base64') === result.attributes.password);
        })
      });
    });
  }

}

module.exports = UserManager;
