module.exports = app => {
  const evaluate = (to, from, text, message) => {
    eval(text);
  };
  app.Commands.set('eval', {
  })
};
