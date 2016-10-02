module.exports = app => {
  const evaluate = (to, from, text, message) => {
    try {
      eval(text);
    } catch (e) {
      console.log(e);
    }
  };
  app.Commands.set('eval', {
    desc: '[valid js] Evaluate for easier testing, should not be used in production',
    access: app.Config.accessLevels.owner,
    call: evaluate
  })
};
