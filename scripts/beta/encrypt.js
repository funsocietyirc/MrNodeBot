'use strict';
const Models = require('bookshelf-model-loader');
const config = require('../../config');

const scrypt = require('scrypt');
const scryptParameters = {
    N: 16,
    r: 1,
    p: 1
};

const _salt = new Buffer(config.userManager.salt);
const _keyLength = config.userManager.keyLength;


module.exports = (app) => {
    // No Db or No Model makes MrNodeBot go something something
    if (!app.Database || !Models.Encrypt) {
        return;
    }

    const decrypt = (to, from, text, message) => {

    };

    const encrypt = (to, from, text, message) => {
      // Format Arguments
      if(!text) {
        app.say(from, `You must give me a nick, a password, and a message`);
        return;
      }
      let messageArray = text.split(' ');
      let recp = messageArray[0];
      let password = messageArray[1];
      if(!recp || !password) {
        app.say(from, `I need both a nick, and a password`);
        return;
      }
      messageArray.splice(0,2);
      let messageText = messageArray.join(' ');

      // Encrypt the message
      scrypt.hash(new Buffer(messageText),scryptParameters,_keyLength,password)
      .then(encryptedMessage => {
        scrypt.hash(new Buffer(password),scryptParameters, _keyLength, _salt)
          .then(encryptedPassword => {
            let model = Models.Encrypt.create({
              to: recp,
              from: from,
              message: encryptedMessage.toString('base64'),
              password: encryptedPassword.toString('base64')
            });
            console.log(model);
          });
      });
    };
    app.Commands.set('encrypt', {
        desc: '[to] [password] [message]',
        access: app.Config.accessLevels.identified,
        call: encrypt
    });

};
