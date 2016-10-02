module.exports = app => {
  const evaluate = (to, from, text, message) => {
    eval(text);
  };
  app.Commands.set('eval', {
    desc: '[valid js] Evaluate for easier testing, should not be used in production',
    access: app.Config.accessLevels.owner,
    call: evaluate
  })
};
