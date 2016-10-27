'use strict';
const scriptInfo = {};

const _ = require('lodash');
const Models = require('bookshelf-model-loader');

module.exports = app => {
    if (!app.Database || !Models.Logging) return scriptInfo;

    const getSexGuess = text => new Promise((resolve, reject) => {
        if (!text || !_.isString(text)) {
            reject('You did not give a input, or gave improer input');
            return;
        }

        // Metric Place Holders
        let MaleInformal = 0;
        let MaleFormal = 0;
        let FemaleInformal = 0;
        let FemaleFormal = 0;

        let TextArray = _(text.split(/[^a-zA-Z]+/))
            .reject(_.isEmpty)
            .value();

        if (TextArray.length < 300) {
            reject('Not Enought words. Try 300 or more');
            return;
        }

        _(TextArray).each(Word => {
            if (!isNaN(DictionaryInformal[Word])) {
                if (DictionaryInformal[Word] > 0) {
                    MaleInformal += DictionaryInformal[Word];
                }
                if (DictionaryInformal[Word] < 0) {
                    FemaleInformal -= DictionaryInformal[Word];
                }
            }
            if (!isNaN(DictionaryFormal[Word])) {
                if (DictionaryFormal[Word] > 0) {
                    MaleFormal += DictionaryFormal[Word];
                }
                if (DictionaryFormal[Word] < 0) {
                    FemaleFormal -= DictionaryFormal[Word];
                }
            }
        });

        let FormalPercentage = MaleFormal + FemaleFormal > 0 ? MaleFormal * 100.0 / (MaleFormal + FemaleFormal) : 0;
        FormalPercentage = FormalPercentage ? parseInt(FormalPercentage * 100) / 100.0 : 0;
        let InformalPercentage = MaleInformal + FemaleInformal > 0 ? MaleInformal * 100.0 / (MaleInformal + FemaleInformal) : 0
        InformalPercentage = InformalPercentage ? parseInt(InformalPercentage * 100) / 100.0 : 0;

        // Guage Informal Sex
        let InformalSex = null;
        if (MaleInformal > FemaleInformal) {
            InformalSex = 'Male';
        } else if (MaleInformal < FemaleInformal) {
            InformalSex = 'Female';
        } else {
            InformalSex = 'Unkown';
        }

        // Guage Formal Sex
        let FormalSex = null;
        if (MaleFormal > FemaleFormal) {
            FormalSex = 'Male';
        } else if (MaleFormal < FemaleFormal) {
            FormalSex = 'Female';
        } else {
            FormalSex = 'Unkown';
        }

        // Return results
        resolve({
          // Formal
            Formal: {
              // Formal
              male: MaleFormal,
              female: FemaleFormal,
              percentage: FormalPercentage,
              diff: MaleFormal - FemaleFormal,
              weak: FormalPercentage > 40 && FormalPercentage < 60,
              sex: FormalSex,
            },
            // Informal
            Informal: {
              male: MaleInformal,
              female: FemaleInformal,
              percentage: InformalPercentage,
              diff: MaleInformal - FemaleInformal,
              weak: InformalPercentage > 40 && InformalPercentage < 60,
              sex: InformalSex,
            }
        });
    });

    const getResults = nick => {
        return Models.Logging.query(qb =>
                qb
                .select(['text'])
                .where('from', 'like', nick)
                .orderBy('id', 'desc')
                .limit(250)
            )
            .fetchAll()
            .then(results => {
                let text = results.pluck('text').join(' ');
                return getSexGuess(text);
            })
    };

    const displaySexGuess = (to, from, text, message) => {
        let [nick] = text.split(' ');
        nick = nick || from;
        getResults(nick)
            .then(results => {
              _.each(results, (v,k) => {
                app.say(to, `Language Genre: ${k} -> Female: ${v.female} -> Male : ${v.male} -> Difference: ${v.diff}; ${v.percentage}% -> Verdict: ${v.sex} ${v.weak ? '(Weak)' : ''}`);
                if(v.weak) {
                  app.say(to,`You scored Weak, which could indiciate European origin.`);
                }
              });
            })
            .catch(err => {
                console.log('Guess Sex Error');
                console.dir(err);
                app.say(to, `Something went wrong analying this data`);
            });
    };
    // Provide a OnConnected provider, this will fire when the bot connects to the network
    app.Commands.set('guess-sex', {
        call: displaySexGuess,
        desc: '[Nick?] Guess the sex of the user',
        access: app.Config.accessLevels.admin
    });

    return scriptInfo;
};

// Dictionary Of Informal Words
const DictionaryInformal = {
    actually: -49,
    am: -42,
    as: 37,
    because: -55,
    but: -43,
    ever: 21,
    everything: -44,
    good: 31,
    has: -33,
    him: -73,
    if: 25,
    in: 10,
    is: 19,
    like: -43,
    more: -41,
    now: 33,
    out: -39,
    since: -25,
    so: -64,
    some: 58,
    something: 26,
    the: 17,
    this: 44,
    too: -38,
    well: 15,
};

// Dictionary of Informal words
const DictionaryFormal = {
    a: 6,
    above: 4,
    and: -4,
    are: 28,
    around: 42,
    as: 23,
    at: 6,
    be: -17,
    below: 8,
    her: -9,
    hers: -3,
    if: -47,
    is: 8,
    it: 6,
    many: 6,
    me: -4,
    more: 34,
    myself: -4,
    not: -27,
    said: 5,
    she: -6,
    should: -7,
    the: 7,
    these: 8,
    to: 2,
    was: -1,
    we: -8,
    what: 35,
    when: -17,
    where: -18,
    who: 19,
    with: -52,
    your: -17,
};
