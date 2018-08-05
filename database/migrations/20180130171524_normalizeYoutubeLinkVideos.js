const helpers = require('../../helpers');

exports.up = async (knex, Promise) => {
    const results = await knex('youTubeLink').select();
    const actions = [];
    for (const result of results) {
        const match = result.url.match(helpers.YoutubeExpression);
        if (!match || !match[2]) {
            actions.push(knex('youTubeLink').where('id', result.id).del());
        } else {
            actions.push(knex('youTubeLink').where('id', result.id).update('url', match[2]));
        }
    }
    return Promise.all(actions);
};

exports.down = function (knex, Promise) {
    return new Promise();
};
