
exports.up = function(knex, Promise) {
  return knex.raw('ALTER TABLE topics MODIFY topic VARCHAR(65536);');
};

exports.down = function(knex, Promise) {
};
