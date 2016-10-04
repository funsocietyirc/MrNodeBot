const _ = require('lodash');
const conLogger = require('../../lib/consoleLogger.js');

module.exports = app => {
  const evaluate = (to, from, text, message) => {
    try {
      eval(text);
      conLogger('Eval command evaluated succesfully','success');
    } catch (e) {
      conLogger('Eval command faild:','error')
      conLongger(e,'error')
    }
  };
  app.Commands.set('eval', {
    desc: '[valid js] Evaluate for easier testing, should not be used in production',
    access: app.Config.accessLevels.owner,
    call: evaluate
  });

  const convaluate = (to, from, text, message) => {
    try {
      let result = eval(text);
      let resultText = _.toString(result);
      conLogger(`Cval result: ${resultText}`,'success');
      if(resultText) {
        app.say(from, `CVAL Result: ${resultText}`);
      }
    } catch (e) {
      conLogger('Cval command failed:','error');
      conLogger(e, 'error');

    }
  };
  app.Commands.set('cval', {
    desc: '[valid js] will return value to console',
    access: app.Config.accessLevels.owner,
    call: convaluate
  });


};
